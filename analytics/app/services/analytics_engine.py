import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

class AnalyticsEngine:

    @staticmethod
    def compute_overview(data: Dict[str, Any]) -> Dict[str, Any]:
        forms_count = data.get("forms_count", 0)
        users_count = data.get("users_count", 0)
        depts_count = data.get("depts_count", 0)
        submissions = data.get("submissions", [])

        subs_df = pd.DataFrame(submissions) if submissions else pd.DataFrame(columns=["id", "status", "department_name", "created_at", "submitted_at", "form_title"])

        submitted_count = len(subs_df[subs_df["status"] == "SUBMITTED"]) if not subs_df.empty else 0
        draft_count = len(subs_df[subs_df["status"] == "DRAFT"]) if not subs_df.empty else 0

        all_departments = data.get("departments", [])
        dept_records = []

        if all_departments:
            for d in all_departments:
                d_id = d["id"]
                d_name = d["department_Name"]
                d_subs = subs_df[subs_df["department_id"] == d_id] if not subs_df.empty and "department_id" in subs_df.columns else pd.DataFrame()
                
                tot = len(d_subs)
                sub_c = len(d_subs[d_subs["status"] == "SUBMITTED"]) if not d_subs.empty else 0
                drf_c = len(d_subs[d_subs["status"] == "DRAFT"]) if not d_subs.empty else 0

                dept_records.append({
                    "id": d_id,
                    "department_Name": d_name,
                    "total_submissions": tot,
                    "submitted_count": sub_c,
                    "draft_count": drf_c
                })
            dept_records = sorted(dept_records, key=lambda x: x["total_submissions"], reverse=True)

        growth_records = []
        if not subs_df.empty:
            dates = pd.to_datetime(subs_df["submitted_at"].fillna(subs_df["created_at"]))
            subs_df["month_period"] = dates.dt.strftime('%Y-%m')
            growth_df = subs_df.groupby("month_period").size().reset_index(name="submission_count")
            growth_records = growth_df.to_dict(orient="records")

        top_forms_records = []
        if not subs_df.empty and "form_title" in subs_df.columns:
            top_df = subs_df.groupby(["form_id", "form_title"]).size().reset_index(name="total_submissions")
            top_df = top_df.sort_values(by="total_submissions", ascending=False).head(5)
            top_forms_records = top_df.rename(columns={"form_id": "id", "form_title": "title"}).to_dict(orient="records")

        return {
            "summary": {
                "total_forms": forms_count,
                "total_users": users_count,
                "total_departments": depts_count,
                "total_submissions": len(submissions),
                "submitted_count": submitted_count,
                "draft_count": draft_count
            },
            "departments": dept_records,
            "growth_trend": growth_records,
            "top_forms": top_forms_records
        }

    @staticmethod
    def compute_form_overview(data: Dict[str, Any]) -> Dict[str, Any]:
        form = data.get("form", {})
        assigned_departments = data.get("assigned_departments", [])
        submissions = data.get("submissions", [])

        sub_df = pd.DataFrame(submissions) if submissions else pd.DataFrame(columns=["id", "status", "created_at", "submitted_at", "dept_name", "user_email"])

        total_assigned = len(assigned_departments)
        total_submissions = len(sub_df)
        submitted_count = len(sub_df[sub_df["status"] == "SUBMITTED"]) if not sub_df.empty else 0
        draft_count = len(sub_df[sub_df["status"] == "DRAFT"]) if not sub_df.empty else 0

        completion_rate = round((submitted_count / total_assigned * 100), 2) if total_assigned > 0 else 0.0

        timeline = []
        if not sub_df.empty:
            dates = pd.to_datetime(sub_df["submitted_at"].fillna(sub_df["created_at"]))
            sub_df["date_period"] = dates.dt.strftime('%Y-%m-%d')
            t_df = sub_df.groupby("date_period").size().reset_index(name="count")
            timeline = t_df.to_dict(orient="records")

        return {
            "form": form,
            "metrics": {
                "assigned_departments": total_assigned,
                "total_submissions": total_submissions,
                "submitted_count": submitted_count,
                "draft_count": draft_count,
                "completion_rate_pct": completion_rate
            },
            "timeline": timeline,
            "submissions": sub_df.to_dict(orient="records") if not sub_df.empty else []
        }

    @staticmethod
    def compute_year_comparison(data: Dict[str, Any]) -> Dict[str, Any]:
        form_id = data.get("form_id", "")
        fields = data.get("fields", [])
        submissions = data.get("submissions", [])
        values = data.get("values", [])

        df = pd.DataFrame(submissions) if submissions else pd.DataFrame()

        if df.empty:
            return {"form_id": form_id, "years_analyzed": [], "years_data": [], "question_year_trends": {}}

        ref_dates = pd.to_datetime(df["submitted_at"].fillna(df["created_at"]))
        df["submission_year"] = ref_dates.dt.year
        df["submission_month"] = ref_dates.dt.month

        years_data = []
        unique_years = sorted(df["submission_year"].dropna().unique().tolist())

        prev_count = None
        for yr in unique_years:
            yr_df = df[df["submission_year"] == yr]
            total_yr_subs = len(yr_df)
            submitted_yr = len(yr_df[yr_df["status"] == "SUBMITTED"])
            draft_yr = len(yr_df[yr_df["status"] == "DRAFT"])

            if prev_count is not None and prev_count > 0:
                growth_pct = round(((total_yr_subs - prev_count) / prev_count) * 100, 2)
            else:
                growth_pct = 0.0
            prev_count = total_yr_subs

            monthly_counts = []
            for m in range(1, 13):
                m_count = len(yr_df[yr_df["submission_month"] == m])
                monthly_counts.append({"month": m, "count": m_count})

            dept_counts = yr_df.groupby("dept_name").size().reset_index(name="count").to_dict(orient="records") if "dept_name" in yr_df.columns else []

            years_data.append({
                "year": int(yr),
                "total_submissions": total_yr_subs,
                "submitted_count": submitted_yr,
                "draft_count": draft_yr,
                "growth_rate_pct": growth_pct,
                "monthly_breakdown": monthly_counts,
                "department_breakdown": dept_counts
            })

        # Per-Question Year-over-Year Comparative Analysis
        vals_df = pd.DataFrame(values) if values else pd.DataFrame(columns=["field_id", "value", "submitted_at"])
        if not vals_df.empty:
            vals_df["submission_year"] = pd.to_datetime(vals_df["submitted_at"]).dt.year

        question_year_trends = {}

        for f in fields:
            f_id = f["field_id"]
            f_type = f["field_type"]
            f_label = f["label"]
            f_key = f["field_key"]
            f_options = f.get("options", [])
            option_labels = {opt["value"]: opt["label"] for opt in f_options}

            f_vals = vals_df[vals_df["field_id"] == f_id] if not vals_df.empty else pd.DataFrame()
            
            yearly_metrics = []

            for yr in unique_years:
                y_vals = f_vals[f_vals["submission_year"] == yr] if not f_vals.empty else pd.DataFrame()
                total_resp = len(y_vals[y_vals["value"].notnull() & (y_vals["value"] != "")]) if not y_vals.empty else 0

                yr_entry = {
                    "year": int(yr),
                    "total_responses": total_resp,
                }

                if f_type == "NUMBER" and not y_vals.empty:
                    nums = pd.to_numeric(y_vals["value"], errors="coerce").dropna()
                    if not nums.empty:
                        yr_entry["average"] = float(round(nums.mean(), 2))
                        yr_entry["min"] = float(nums.min())
                        yr_entry["max"] = float(nums.max())
                        yr_entry["sum"] = float(round(nums.sum(), 2))
                    else:
                        yr_entry["average"] = 0.0

                elif f_type in ["SELECT", "RADIO", "CHECKBOX"] and not y_vals.empty:
                    raw_values = []
                    for val in y_vals["value"].dropna():
                        if f_type == "CHECKBOX" and "," in str(val):
                            raw_values.extend([v.strip() for v in str(val).split(",") if v.strip()])
                        elif str(val).strip():
                            raw_values.append(str(val).strip())
                    v_counts = pd.Series(raw_values).value_counts().to_dict() if raw_values else {}
                    
                    dist = []
                    for opt_val, count in v_counts.items():
                        opt_lbl = option_labels.get(str(opt_val), str(opt_val))
                        dist.append({"option_value": str(opt_val), "option_label": opt_lbl, "count": int(count)})
                    yr_entry["option_distribution"] = dist

                elif f_type in ["TEXT", "TEXTAREA"] and not y_vals.empty:
                    txts = y_vals["value"].dropna().astype(str)
                    txts = txts[txts.str.strip() != ""]
                    if not txts.empty:
                        yr_entry["avg_char_length"] = float(round(txts.str.len().mean(), 1))
                        yr_entry["avg_word_count"] = float(round(txts.str.split().str.len().mean(), 1))

                yearly_metrics.append(yr_entry)

            question_year_trends[f_id] = {
                "field_id": f_id,
                "label": f_label,
                "field_key": f_key,
                "field_type": f_type,
                "section_title": f.get("section_title", ""),
                "yearly_metrics": yearly_metrics
            }

        return {
            "form_id": form_id,
            "years_analyzed": [int(y) for y in unique_years],
            "years_data": years_data,
            "fields_list": [{"field_id": f["field_id"], "label": f["label"], "field_type": f["field_type"]} for f in fields],
            "question_year_trends": question_year_trends
        }

    @staticmethod
    def compute_submission_comparison(data: Dict[str, Any]) -> Dict[str, Any]:
        form_id = data.get("form_id", "")
        submission_ids = data.get("submission_ids", [])
        fields = data.get("fields", [])
        submissions = data.get("submissions", [])
        values = data.get("values", [])

        if not submission_ids:
            return {"error": "No submission IDs provided"}

        vals_df = pd.DataFrame(values) if values else pd.DataFrame(columns=["submission_id", "field_id", "value"])

        field_matrix = []
        matching_fields = 0
        total_fields = len(fields)
        numeric_comparisons = []

        for f in fields:
            f_id = f["field_id"]
            f_type = f["field_type"]
            values_by_sub = {}
            unique_vals = set()

            for sub_id in submission_ids:
                val_row = vals_df[(vals_df["submission_id"] == sub_id) & (vals_df["field_id"] == f_id)] if not vals_df.empty else pd.DataFrame()
                val_str = str(val_row["value"].iloc[0]) if not val_row.empty and pd.notnull(val_row["value"].iloc[0]) else ""
                values_by_sub[sub_id] = val_str
                unique_vals.add(val_str)

            is_match = (len(unique_vals) == 1)
            if is_match:
                matching_fields += 1

            field_matrix.append({
                "field_id": f_id,
                "label": f["label"],
                "field_key": f["field_key"],
                "field_type": f_type,
                "section_title": f["section_title"],
                "values": values_by_sub,
                "is_match": is_match
            })

            # If numeric field, collect comparison data across submissions for chart rendering
            if f_type == "NUMBER":
                num_vals_by_sub = {}
                for sub_id, val_str in values_by_sub.items():
                    try:
                        num_vals_by_sub[sub_id] = float(val_str) if val_str != "" else 0.0
                    except ValueError:
                        num_vals_by_sub[sub_id] = 0.0

                numeric_comparisons.append({
                    "field_id": f_id,
                    "label": f["label"],
                    "values": num_vals_by_sub
                })

        similarity_pct = round((matching_fields / total_fields * 100), 2) if total_fields > 0 else 100.0

        return {
            "form_id": form_id,
            "submissions": submissions,
            "field_comparison": field_matrix,
            "numeric_comparisons": numeric_comparisons,
            "metrics": {
                "total_fields": total_fields,
                "matching_fields": matching_fields,
                "differing_fields": total_fields - matching_fields,
                "similarity_pct": similarity_pct
            }
        }

    @staticmethod
    def compute_question_comparison(data: Dict[str, Any]) -> Dict[str, Any]:
        form_id = data.get("form_id", "")
        fields = data.get("fields", [])
        values = data.get("values", [])

        vals_df = pd.DataFrame(values) if values else pd.DataFrame(columns=["field_id", "value", "dept_name", "submitted_at"])
        if not vals_df.empty:
            ref_dates = pd.to_datetime(vals_df["submitted_at"])
            vals_df["submission_year"] = ref_dates.dt.year

        questions_analysis = []

        for f in fields:
            f_id = f["field_id"]
            f_type = f["field_type"]
            f_label = f["label"]
            f_key = f["field_key"]
            sec_title = f["section_title"]
            f_options = f.get("options", [])

            f_vals = vals_df[vals_df["field_id"] == f_id] if not vals_df.empty else pd.DataFrame()
            total_responses = len(f_vals[f_vals["value"].notnull() & (f_vals["value"] != "")]) if not f_vals.empty else 0

            q_data = {
                "field_id": f_id,
                "label": f_label,
                "field_key": f_key,
                "field_type": f_type,
                "section_title": sec_title,
                "total_responses": total_responses
            }

            if f_type in ["SELECT", "RADIO", "CHECKBOX"]:
                option_labels = {opt["value"]: opt["label"] for opt in f_options}

                raw_values = []
                if not f_vals.empty:
                    for val in f_vals["value"].dropna():
                        if f_type == "CHECKBOX" and "," in str(val):
                            raw_values.extend([v.strip() for v in str(val).split(",") if v.strip()])
                        elif str(val).strip():
                            raw_values.append(str(val).strip())

                val_counts = pd.Series(raw_values).value_counts() if raw_values else pd.Series(dtype=int)

                dist = []
                total_val_items = len(raw_values)
                for opt_val, count in val_counts.items():
                    opt_lbl = option_labels.get(str(opt_val), str(opt_val))
                    pct = round((count / total_val_items * 100), 2) if total_val_items > 0 else 0.0
                    dist.append({"option_value": str(opt_val), "option_label": opt_lbl, "count": int(count), "percentage": pct})

                dept_dist = []
                if not f_vals.empty and "dept_name" in f_vals.columns:
                    for dept, d_df in f_vals.groupby("dept_name"):
                        d_vals = []
                        for val in d_df["value"].dropna():
                            if f_type == "CHECKBOX" and "," in str(val):
                                d_vals.extend([v.strip() for v in str(val).split(",") if v.strip()])
                            elif str(val).strip():
                                d_vals.append(str(val).strip())
                        d_counts = pd.Series(d_vals).value_counts().to_dict() if d_vals else {}
                        dept_dist.append({"department": dept, "distribution": d_counts})

                year_dist = []
                if not f_vals.empty and "submission_year" in f_vals.columns:
                    for yr, y_df in f_vals.groupby("submission_year"):
                        y_vals = []
                        for val in y_df["value"].dropna():
                            if f_type == "CHECKBOX" and "," in str(val):
                                y_vals.extend([v.strip() for v in str(val).split(",") if v.strip()])
                            elif str(val).strip():
                                y_vals.append(str(val).strip())
                        y_counts = pd.Series(y_vals).value_counts().to_dict() if y_vals else {}
                        year_dist.append({"year": int(yr), "distribution": y_counts})

                q_data["options_distribution"] = dist
                q_data["department_distribution"] = dept_dist
                q_data["year_distribution"] = year_dist

            elif f_type == "NUMBER":
                num_series = pd.to_numeric(f_vals["value"], errors="coerce").dropna() if not f_vals.empty else pd.Series(dtype=float)

                if not num_series.empty:
                    stats = {
                        "count": int(len(num_series)),
                        "min": float(num_series.min()),
                        "max": float(num_series.max()),
                        "average": float(round(num_series.mean(), 2)),
                        "median": float(round(num_series.median(), 2)),
                        "std_dev": float(round(num_series.std(), 2)) if len(num_series) > 1 else 0.0,
                        "total_sum": float(round(num_series.sum(), 2))
                    }
                    counts, bin_edges = np.histogram(num_series, bins=min(5, len(num_series.unique())))
                    bins_data = []
                    for i in range(len(counts)):
                        bins_data.append({
                            "range": f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}",
                            "count": int(counts[i])
                        })
                    stats["distribution_bins"] = bins_data

                    yr_avgs = []
                    if "submission_year" in f_vals.columns:
                        for yr, y_df in f_vals.groupby("submission_year"):
                            y_nums = pd.to_numeric(y_df["value"], errors="coerce").dropna()
                            if not y_nums.empty:
                                yr_avgs.append({"year": int(yr), "average": float(round(y_nums.mean(), 2))})
                    stats["year_averages"] = yr_avgs

                    dept_avgs = []
                    if "dept_name" in f_vals.columns:
                        for dept, d_df in f_vals.groupby("dept_name"):
                            d_nums = pd.to_numeric(d_df["value"], errors="coerce").dropna()
                            if not d_nums.empty:
                                dept_avgs.append({"department": dept, "average": float(round(d_nums.mean(), 2))})
                    stats["department_averages"] = dept_avgs

                    q_data["numeric_stats"] = stats
                else:
                    q_data["numeric_stats"] = None

            elif f_type in ["TEXT", "TEXTAREA"]:
                txt_series = f_vals["value"].dropna().astype(str) if not f_vals.empty else pd.Series(dtype=str)
                txt_series = txt_series[txt_series.str.strip() != ""]

                if not txt_series.empty:
                    char_lens = txt_series.str.len()
                    word_counts = txt_series.str.split().str.len()

                    words = [w.lower().strip(".,!?:;") for text in txt_series for w in text.split() if len(w) > 3]
                    top_words = pd.Series(words).value_counts().head(5).to_dict() if words else {}
                    words_list = [{"word": w, "count": int(c)} for w, c in top_words.items()]

                    q_data["text_stats"] = {
                        "count": int(len(txt_series)),
                        "avg_char_length": float(round(char_lens.mean(), 1)),
                        "min_char_length": int(char_lens.min()),
                        "max_char_length": int(char_lens.max()),
                        "avg_word_count": float(round(word_counts.mean(), 1)),
                        "top_keywords": words_list
                    }
                else:
                    q_data["text_stats"] = None

            elif f_type == "DATE":
                dates_series = pd.to_datetime(f_vals["value"], errors="coerce").dropna() if not f_vals.empty else pd.Series()
                if not dates_series.empty:
                    q_data["date_stats"] = {
                        "count": int(len(dates_series)),
                        "earliest_date": dates_series.min().strftime('%Y-%m-%d'),
                        "latest_date": dates_series.max().strftime('%Y-%m-%d')
                    }
                else:
                    q_data["date_stats"] = None

            questions_analysis.append(q_data)

        return {
            "form_id": form_id,
            "total_questions": len(fields),
            "questions": questions_analysis
        }

    @staticmethod
    def compute_growth_reporting(data: Dict[str, Any]) -> Dict[str, Any]:
        form_id = data.get("form_id", "")
        submissions = data.get("submissions", [])

        df = pd.DataFrame(submissions) if submissions else pd.DataFrame()

        if df.empty:
            return {"form_id": form_id, "cumulative_growth": [], "monthly_growth_rate": []}

        df["ref_date"] = pd.to_datetime(df["submitted_at"].fillna(df["created_at"]))
        df = df.sort_values(by="ref_date", ascending=True)
        df["month_year"] = df["ref_date"].dt.strftime('%Y-%m')

        df["count"] = 1
        df["cumulative"] = df["count"].cumsum()
        df["date_str"] = df["ref_date"].dt.strftime('%Y-%m-%d')
        cumulative_growth = df[["date_str", "cumulative"]].drop_duplicates(subset=["date_str"], keep="last").to_dict(orient="records")

        monthly_df = df.groupby("month_year").size().reset_index(name="monthly_count")
        monthly_df["prev_count"] = monthly_df["monthly_count"].shift(1)
        monthly_df["growth_rate_pct"] = np.where(
            monthly_df["prev_count"].notnull() & (monthly_df["prev_count"] > 0),
            round(((monthly_df["monthly_count"] - monthly_df["prev_count"]) / monthly_df["prev_count"]) * 100, 2),
            0.0
        )

        return {
            "form_id": form_id,
            "cumulative_growth": cumulative_growth,
            "monthly_growth_rate": monthly_df[["month_year", "monthly_count", "growth_rate_pct"]].to_dict(orient="records")
        }
