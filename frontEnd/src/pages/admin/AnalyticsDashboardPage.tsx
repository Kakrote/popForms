import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, formsApi } from "../../lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Layers,
  Building2,
  Clock,
  Filter,
  Sliders,
  CheckSquare,
  Sparkles,
  FolderKanban
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "years" | "submissions" | "growth">("overview");
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [selectedYearSectionTitle, setSelectedYearSectionTitle] = useState<string>("ALL");
  const [selectedSubSectionTitle, setSelectedSubSectionTitle] = useState<string>("ALL");

  // Fetch all forms for dropdown selectors
  const { data: forms } = useQuery({
    queryKey: ["forms-list-analytics"],
    queryFn: formsApi.list,
  });

  // Set default selected form when forms load
  React.useEffect(() => {
    if (forms && forms.length > 0 && !selectedFormId) {
      setSelectedFormId(forms[0].id);
    }
  }, [forms, selectedFormId]);

  // Overview analytics query
  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: analyticsApi.getOverview,
    enabled: activeTab === "overview",
  });

  // Question-wise analytics query
  const { data: questionData, isLoading: isQuestionLoading } = useQuery({
    queryKey: ["analytics-questions", selectedFormId],
    queryFn: () => analyticsApi.getQuestionComparison(selectedFormId),
    enabled: (activeTab === "questions") && Boolean(selectedFormId),
  });

  // Year-wise comparison query
  const { data: yearData, isLoading: isYearLoading } = useQuery({
    queryKey: ["analytics-years", selectedFormId],
    queryFn: () => analyticsApi.getYearComparison(selectedFormId),
    enabled: (activeTab === "years") && Boolean(selectedFormId),
  });

  // Submission-wise comparison query
  const { data: formOverviewData } = useQuery({
    queryKey: ["analytics-form-overview", selectedFormId],
    queryFn: () => analyticsApi.getFormOverview(selectedFormId),
    enabled: (activeTab === "submissions") && Boolean(selectedFormId),
  });

  const { data: submissionComparisonData, isLoading: isSubCompLoading } = useQuery({
    queryKey: ["analytics-sub-comparison", selectedFormId, selectedSubmissions],
    queryFn: () => analyticsApi.getSubmissionComparison(selectedFormId, selectedSubmissions),
    enabled: (activeTab === "submissions") && Boolean(selectedFormId) && selectedSubmissions.length > 0,
  });

  // Growth reporting query
  const { data: growthData, isLoading: isGrowthLoading } = useQuery({
    queryKey: ["analytics-growth", selectedFormId],
    queryFn: () => analyticsApi.getGrowthReporting(selectedFormId),
    enabled: (activeTab === "growth") && Boolean(selectedFormId),
  });

  const toggleSubmissionSelection = (id: string) => {
    setSelectedSubmissions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* HEADER SECTION */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(37, 99, 235, 0.1)", padding: 8, borderRadius: 8, color: "var(--primary)" }}>
              <BarChart3 size={24} />
            </div>
            <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Analytics Engine & Dashboard</h1>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            Python-powered comparative analysis: form performance, submission comparison, YoY trends, and question statistical breakdowns.
          </p>
        </div>

        {/* Form Selector for Form-specific tabs */}
        {activeTab !== "overview" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-elevated, #f8fafc)", padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)" }}>
            <Filter size={16} className="muted" />
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Select Form:</span>
            <select
              value={selectedFormId}
              onChange={(e) => {
                setSelectedFormId(e.target.value);
                setSelectedSubmissions([]);
                setSelectedYearSectionTitle("ALL");
                setSelectedSubSectionTitle("ALL");
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontWeight: 600,
                fontSize: "0.9rem"
              }}
            >
              {forms?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: "flex", gap: 8, borderBottom: "2px solid var(--border)", marginBottom: 24, overflowX: "auto" }}>
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            fontWeight: 600,
            cursor: "pointer",
            borderBottom: activeTab === "overview" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "overview" ? "var(--primary)" : "var(--muted)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <BarChart3 size={18} /> Overall Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
          onClick={() => setActiveTab("questions")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            fontWeight: 600,
            cursor: "pointer",
            borderBottom: activeTab === "questions" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "questions" ? "var(--primary)" : "var(--muted)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <HelpCircle size={18} /> Question-wise Comparison
        </button>
        <button
          className={`tab-btn ${activeTab === "years" ? "active" : ""}`}
          onClick={() => setActiveTab("years")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            fontWeight: 600,
            cursor: "pointer",
            borderBottom: activeTab === "years" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "years" ? "var(--primary)" : "var(--muted)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <Calendar size={18} /> Year-wise Comparison
        </button>
        <button
          className={`tab-btn ${activeTab === "submissions" ? "active" : ""}`}
          onClick={() => setActiveTab("submissions")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            fontWeight: 600,
            cursor: "pointer",
            borderBottom: activeTab === "submissions" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "submissions" ? "var(--primary)" : "var(--muted)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <FileSpreadsheet size={18} /> Submission Comparison
        </button>
        <button
          className={`tab-btn ${activeTab === "growth" ? "active" : ""}`}
          onClick={() => setActiveTab("growth")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            fontWeight: 600,
            cursor: "pointer",
            borderBottom: activeTab === "growth" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "growth" ? "var(--primary)" : "var(--muted)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <TrendingUp size={18} /> Growth & Velocity
        </button>
      </div>

      {/* TAB 1: OVERALL SYSTEM DASHBOARD */}
      {activeTab === "overview" && (
        <div>
          {isOverviewLoading ? (
            <div style={{ padding: 40, textAlign: "center" }}>Loading System Analytics...</div>
          ) : overviewData ? (
            <div>
              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ background: "#eff6ff", color: "#2563eb", padding: 12, borderRadius: 10 }}>
                    <Layers size={24} />
                  </div>
                  <div>
                    <span className="muted small">Total Forms</span>
                    <h2 style={{ margin: 0, fontSize: "1.6rem" }}>{overviewData.summary.total_forms}</h2>
                  </div>
                </div>

                <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ background: "#f0fdf4", color: "#16a34a", padding: 12, borderRadius: 10 }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <span className="muted small">Submitted</span>
                    <h2 style={{ margin: 0, fontSize: "1.6rem" }}>{overviewData.summary.submitted_count}</h2>
                  </div>
                </div>

                <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ background: "#fefce8", color: "#ca8a04", padding: 12, borderRadius: 10 }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <span className="muted small">Draft Submissions</span>
                    <h2 style={{ margin: 0, fontSize: "1.6rem" }}>{overviewData.summary.draft_count}</h2>
                  </div>
                </div>

                <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ background: "#faf5ff", color: "#9333ea", padding: 12, borderRadius: 10 }}>
                    <Building2 size={24} />
                  </div>
                  <div>
                    <span className="muted small">Departments</span>
                    <h2 style={{ margin: 0, fontSize: "1.6rem" }}>{overviewData.summary.total_departments}</h2>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24, marginBottom: 30 }}>
                {/* Global Submission Growth Chart */}
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: "1.1rem" }}>Global Submission Velocity</h3>
                  {overviewData.growth_trend?.length > 0 ? (
                    <Line
                      data={{
                        labels: overviewData.growth_trend.map((g: any) => g.month_period),
                        datasets: [
                          {
                            label: "Submissions",
                            data: overviewData.growth_trend.map((g: any) => g.submission_count),
                            borderColor: "#2563eb",
                            backgroundColor: "rgba(37, 99, 235, 0.1)",
                            fill: true,
                            tension: 0.3,
                          },
                        ],
                      }}
                      options={{ responsive: true, plugins: { legend: { display: false } } }}
                    />
                  ) : (
                    <p className="muted">No submission trend data available yet.</p>
                  )}
                </div>

                {/* Status Breakdown Pie Chart */}
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: "1.1rem" }}>Submission Status Breakdown</h3>
                  <div style={{ maxWidth: 280, margin: "0 auto" }}>
                    <Doughnut
                      data={{
                        labels: ["Submitted", "Draft"],
                        datasets: [
                          {
                            data: [overviewData.summary.submitted_count, overviewData.summary.draft_count],
                            backgroundColor: ["#22c55e", "#eab308"],
                          },
                        ],
                      }}
                      options={{ responsive: true }}
                    />
                  </div>
                </div>
              </div>

              {/* Department Leaderboard Table */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: "1.1rem" }}>Department Participation Leaderboard</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)" }}>
                        <th style={{ padding: "10px 12px" }}>Department</th>
                        <th style={{ padding: "10px 12px" }}>Total Submissions</th>
                        <th style={{ padding: "10px 12px" }}>Submitted</th>
                        <th style={{ padding: "10px 12px" }}>Drafts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewData.departments?.map((d: any) => (
                        <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "12px", fontWeight: 600 }}>{d.department_Name}</td>
                          <td style={{ padding: "12px" }}>{d.total_submissions}</td>
                          <td style={{ padding: "12px", color: "#16a34a", fontWeight: 600 }}>{d.submitted_count}</td>
                          <td style={{ padding: "12px", color: "#ca8a04" }}>{d.draft_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">No overview analytics data found.</p>
          )}
        </div>
      )}

      {/* TAB 2: QUESTION-WISE COMPARISON */}
      {activeTab === "questions" && (
        <div>
          {!selectedFormId ? (
            <p className="muted">Please select a form from the top right dropdown.</p>
          ) : isQuestionLoading ? (
            <div style={{ padding: 40, textAlign: "center" }}>Analyzing questions and statistical distributions...</div>
          ) : questionData ? (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>Question-Wise Statistical Analysis</h2>
                <p className="muted">Detailed breakdown, option distribution, and statistical metrics per form question.</p>
              </div>

              {questionData.questions?.map((q: any, idx: number) => (
                <div key={q.field_id} className="card" style={{ padding: 24, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <span className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                        {q.section_title} • Question #{idx + 1} ({q.field_type})
                      </span>
                      <h3 style={{ margin: "4px 0 0 0", fontSize: "1.2rem" }}>{q.label}</h3>
                    </div>
                    <span style={{ background: "var(--border)", padding: "4px 10px", borderRadius: 12, fontSize: "0.8rem", fontWeight: 600 }}>
                      {q.total_responses} Responses
                    </span>
                  </div>

                  {/* CATEGORICAL / CHOICE QUESTIONS */}
                  {["SELECT", "RADIO", "CHECKBOX"].includes(q.field_type) && q.options_distribution && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                        <div>
                          <h4 style={{ fontSize: "0.95rem", marginBottom: 12 }}>Option Response Distribution</h4>
                          <Bar
                            data={{
                              labels: q.options_distribution.map((o: any) => o.option_label),
                              datasets: [
                                {
                                  label: "Responses",
                                  data: q.options_distribution.map((o: any) => o.count),
                                  backgroundColor: "#3b82f6",
                                  borderRadius: 4,
                                },
                              ],
                            }}
                            options={{ responsive: true, plugins: { legend: { display: false } } }}
                          />
                        </div>

                        <div>
                          <h4 style={{ fontSize: "0.95rem", marginBottom: 12 }}>Percentage Breakdown</h4>
                          <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
                            {q.options_distribution.map((o: any) => (
                              <div key={o.option_value} style={{ marginBottom: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
                                  <span>{o.option_label}</span>
                                  <strong>{o.percentage}% ({o.count})</strong>
                                </div>
                                <div style={{ background: "var(--border)", height: 8, borderRadius: 4, overflow: "hidden" }}>
                                  <div style={{ background: "#3b82f6", height: "100%", width: `${o.percentage}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NUMERICAL QUESTIONS */}
                  {q.field_type === "NUMBER" && q.numeric_stats && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 16 }}>
                        <div style={{ background: "var(--surface-elevated, #f8fafc)", padding: 12, borderRadius: 8, textAlign: "center", border: "1px solid var(--border)" }}>
                          <span className="muted small">Average</span>
                          <h4 style={{ margin: "4px 0 0 0", color: "#2563eb" }}>{q.numeric_stats.average}</h4>
                        </div>
                        <div style={{ background: "var(--surface-elevated, #f8fafc)", padding: 12, borderRadius: 8, textAlign: "center", border: "1px solid var(--border)" }}>
                          <span className="muted small">Median</span>
                          <h4 style={{ margin: "4px 0 0 0" }}>{q.numeric_stats.median}</h4>
                        </div>
                        <div style={{ background: "var(--surface-elevated, #f8fafc)", padding: 12, borderRadius: 8, textAlign: "center", border: "1px solid var(--border)" }}>
                          <span className="muted small">Min / Max</span>
                          <h4 style={{ margin: "4px 0 0 0" }}>{q.numeric_stats.min} / {q.numeric_stats.max}</h4>
                        </div>
                        <div style={{ background: "var(--surface-elevated, #f8fafc)", padding: 12, borderRadius: 8, textAlign: "center", border: "1px solid var(--border)" }}>
                          <span className="muted small">Std Dev</span>
                          <h4 style={{ margin: "4px 0 0 0" }}>{q.numeric_stats.std_dev}</h4>
                        </div>
                        <div style={{ background: "var(--surface-elevated, #f8fafc)", padding: 12, borderRadius: 8, textAlign: "center", border: "1px solid var(--border)" }}>
                          <span className="muted small">Total Sum</span>
                          <h4 style={{ margin: "4px 0 0 0" }}>{q.numeric_stats.total_sum}</h4>
                        </div>
                      </div>

                      {q.numeric_stats.distribution_bins && (
                        <div>
                          <h4 style={{ fontSize: "0.95rem", marginBottom: 10 }}>Value Bins Histogram</h4>
                          <Bar
                            data={{
                              labels: q.numeric_stats.distribution_bins.map((b: any) => b.range),
                              datasets: [
                                {
                                  label: "Frequency",
                                  data: q.numeric_stats.distribution_bins.map((b: any) => b.count),
                                  backgroundColor: "#10b981",
                                },
                              ],
                            }}
                            options={{ responsive: true, plugins: { legend: { display: false } } }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* TEXT QUESTIONS */}
                  {["TEXT", "TEXTAREA"].includes(q.field_type) && q.text_stats && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <span className="muted small">Response Volume & Length:</span>
                          <p style={{ margin: "4px 0 0 0" }}>
                            Avg Character Length: <strong>{q.text_stats.avg_char_length}</strong> | Avg Words: <strong>{q.text_stats.avg_word_count}</strong>
                          </p>
                        </div>
                        {q.text_stats.top_keywords?.length > 0 && (
                          <div style={{ flex: 1, minWidth: 250 }}>
                            <span className="muted small">Top Recurring Keywords:</span>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                              {q.text_stats.top_keywords.map((kw: any) => (
                                <span key={kw.word} style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: 12, fontSize: "0.8rem", fontWeight: 600 }}>
                                  {kw.word} ({kw.count})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DATE QUESTIONS */}
                  {q.field_type === "DATE" && q.date_stats && (
                    <div style={{ marginTop: 12 }}>
                      <span className="muted small">Date Span:</span>
                      <p style={{ margin: "4px 0 0 0" }}>
                        Earliest: <strong>{q.date_stats.earliest_date}</strong> to Latest: <strong>{q.date_stats.latest_date}</strong>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No question comparative data available for this form.</p>
          )}
        </div>
      )}

      {/* TAB 3: YEAR-WISE COMPARISON */}
      {activeTab === "years" && (
        <div>
          {!selectedFormId ? (
            <p className="muted">Please select a form from the top right dropdown.</p>
          ) : isYearLoading ? (
            <div style={{ padding: 40, textAlign: "center" }}>Comparing year-over-year submission metrics...</div>
          ) : yearData && yearData.years_data?.length > 0 ? (
            <div>
              {/* Section Selection Toolbar for Year-Wise Analysis */}
              <div className="card" style={{ padding: 20, marginBottom: 24, background: "var(--surface-elevated, #f8fafc)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FolderKanban size={20} color="var(--primary)" />
                    <div>
                      <strong style={{ fontSize: "1.05rem" }}>Section-Wise Year Comparison</strong>
                      <p className="muted small" style={{ margin: 0 }}>Filter Year-over-Year metrics by Form Section.</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Filter size={16} className="muted" />
                    <select
                      value={selectedYearSectionTitle}
                      onChange={(e) => setSelectedYearSectionTitle(e.target.value)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        maxWidth: "350px"
                      }}
                    >
                      <option value="ALL">📂 All Sections (Full Form Volume)</option>
                      {yearData.sections_list?.map((s: any) => (
                        <option key={s.title} value={s.title}>
                          Section: {s.title} ({s.fields_count} fields)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section Clickable Chips Bar */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedYearSectionTitle("ALL")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: selectedYearSectionTitle === "ALL" ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: selectedYearSectionTitle === "ALL" ? "#eff6ff" : "var(--surface)",
                      color: selectedYearSectionTitle === "ALL" ? "var(--primary)" : "var(--text)",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      cursor: "pointer"
                    }}
                  >
                    All Sections
                  </button>

                  {yearData.sections_list?.map((s: any) => {
                    const isSelected = selectedYearSectionTitle === s.title;
                    return (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => setSelectedYearSectionTitle(s.title)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: isSelected ? "#eff6ff" : "var(--surface)",
                          color: isSelected ? "var(--primary)" : "var(--text)",
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: "0.82rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <FolderKanban size={13} style={{ opacity: 0.7 }} />
                        {s.title}
                        <span className="badge small" style={{ fontSize: "0.65rem", padding: "0px 4px" }}>{s.fields_count} fields</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OVERALL FORM VOLUME */}
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>
                  {selectedYearSectionTitle === "ALL" ? "Overall Form Volume (Year-Over-Year)" : `Section: ${selectedYearSectionTitle} (Year-Over-Year)`}
                </h2>
                <p className="muted">Submission counts, growth percentage rates, and monthly trend lines across calendar years.</p>
              </div>

              {/* Year Summary Metric Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                {yearData.years_data.map((yr: any) => (
                  <div key={yr.year} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)" }}>Year {yr.year}</span>
                      <span
                        style={{
                          background: yr.growth_rate_pct >= 0 ? "#dcfce7" : "#fee2e2",
                          color: yr.growth_rate_pct >= 0 ? "#15803d" : "#b91c1c",
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontSize: "0.75rem",
                          fontWeight: 700
                        }}
                      >
                        {yr.growth_rate_pct >= 0 ? `+${yr.growth_rate_pct}%` : `${yr.growth_rate_pct}%`} YoY
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.5rem" }}>{yr.total_submissions} <span className="muted small" style={{ fontWeight: 400 }}>Submissions</span></h3>
                    <p className="muted small" style={{ margin: "4px 0 0 0" }}>
                      Submitted: {yr.submitted_count} | Drafts: {yr.draft_count}
                    </p>
                  </div>
                ))}
              </div>

              {/* Monthly Comparative Chart across Years */}
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>Monthly Submission Comparison Across Years</h3>
                <Line
                  data={{
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                    datasets: yearData.years_data.map((yr: any, idx: number) => {
                      const colors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
                      const color = colors[idx % colors.length];
                      return {
                        label: `Year ${yr.year}`,
                        data: yr.monthly_breakdown.map((m: any) => m.count),
                        borderColor: color,
                        backgroundColor: color,
                        tension: 0.3,
                      };
                    }),
                  }}
                  options={{ responsive: true }}
                />
              </div>

              {/* Detailed Year-by-Year Comparison Table */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>Year-by-Year Performance Matrix</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)" }}>
                        <th style={{ padding: 12 }}>Year</th>
                        <th style={{ padding: 12 }}>Total Submissions</th>
                        <th style={{ padding: 12 }}>Submitted vs Draft</th>
                        <th style={{ padding: 12 }}>YoY Growth Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearData.years_data.map((yr: any) => (
                        <tr key={yr.year} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: 12, fontWeight: 700 }}>{yr.year}</td>
                          <td style={{ padding: 12 }}>{yr.total_submissions}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{ color: "#16a34a", fontWeight: 600 }}>{yr.submitted_count} submitted</span> / {yr.draft_count} draft
                          </td>
                          <td style={{ padding: 12, fontWeight: 700, color: yr.growth_rate_pct >= 0 ? "#16a34a" : "#dc2626" }}>
                            {yr.growth_rate_pct >= 0 ? `+${yr.growth_rate_pct}%` : `${yr.growth_rate_pct}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">No year-wise comparison data found for this form.</p>
          )}
        </div>
      )}

      {/* TAB 4: SUBMISSION-WISE COMPARISON */}
      {activeTab === "submissions" && (
        <div>
          {!selectedFormId ? (
            <p className="muted">Please select a form from the top right dropdown.</p>
          ) : (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>Side-by-Side Submission Comparison</h2>
                <p className="muted">Select 2 or more submissions below to perform section-based or overall field diff comparison.</p>
              </div>

              {/* Submissions Picker list */}
              <div className="card" style={{ padding: 16, marginBottom: 24 }}>
                <h4 style={{ marginTop: 0, marginBottom: 12 }}>Select Submissions to Compare:</h4>
                {formOverviewData?.submissions?.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
                    {formOverviewData.submissions.map((sub: any) => {
                      const isSelected = selectedSubmissions.includes(sub.id);
                      return (
                        <div
                          key={sub.id}
                          onClick={() => toggleSubmissionSelection(sub.id)}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                            background: isSelected ? "rgba(37, 99, 235, 0.05)" : "var(--surface)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                          }}
                        >
                          <div>
                            <strong style={{ display: "block", fontSize: "0.9rem" }}>{sub.dept_name}</strong>
                            <span className="muted small">{sub.user_email || "User"} • {sub.status}</span>
                          </div>
                          {isSelected ? <CheckSquare color="var(--primary)" size={20} /> : <div style={{ width: 18, height: 18, border: "2px solid var(--border)", borderRadius: 4 }} />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="muted">No submissions recorded for this form yet.</p>
                )}
              </div>

              {/* Comparison Output */}
              {selectedSubmissions.length < 2 ? (
                <div style={{ textAlign: "center", padding: 30, background: "var(--surface-elevated, #f8fafc)", borderRadius: 12, border: "1px dashed var(--border)" }}>
                  <Sliders size={32} className="muted" style={{ marginBottom: 8 }} />
                  <p className="muted" style={{ margin: 0 }}>Select at least 2 submissions above to compare answers.</p>
                </div>
              ) : isSubCompLoading ? (
                <div style={{ padding: 30, textAlign: "center" }}>Comparing submission fields...</div>
              ) : submissionComparisonData ? (
                <div>
                  {/* SECTION SELECTOR TOOLBAR FOR SUBMISSION COMPARISON */}
                  <div className="card" style={{ padding: 20, marginBottom: 24, background: "var(--surface-elevated, #f8fafc)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <FolderKanban size={20} color="var(--primary)" />
                        <div>
                          <strong style={{ fontSize: "1.05rem" }}>Filter Comparison by Form Section</strong>
                          <p className="muted small" style={{ margin: 0 }}>Select a specific section to focus comparison on questions within that section.</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Filter size={16} className="muted" />
                        <select
                          value={selectedSubSectionTitle}
                          onChange={(e) => setSelectedSubSectionTitle(e.target.value)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            maxWidth: "350px"
                          }}
                        >
                          <option value="ALL">📂 All Sections (Full Diff Matrix & Summary)</option>
                          {submissionComparisonData.sections_list?.map((s: any) => (
                            <option key={s.title} value={s.title}>
                              Section: {s.title} ({s.fields_count} fields)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Section Clickable Chips Bar */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => setSelectedSubSectionTitle("ALL")}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          border: selectedSubSectionTitle === "ALL" ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: selectedSubSectionTitle === "ALL" ? "#eff6ff" : "var(--surface)",
                          color: selectedSubSectionTitle === "ALL" ? "var(--primary)" : "var(--text)",
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          cursor: "pointer"
                        }}
                      >
                        All Sections Matrix
                      </button>

                      {submissionComparisonData.sections_list?.map((s: any) => {
                        const isSelected = selectedSubSectionTitle === s.title;
                        return (
                          <button
                            key={s.title}
                            type="button"
                            onClick={() => setSelectedSubSectionTitle(s.title)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 20,
                              border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                              background: isSelected ? "#eff6ff" : "var(--surface)",
                              color: isSelected ? "var(--primary)" : "var(--text)",
                              fontWeight: isSelected ? 700 : 500,
                              fontSize: "0.82rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <FolderKanban size={13} style={{ opacity: 0.7 }} />
                            {s.title}
                            <span className="badge small" style={{ fontSize: "0.65rem", padding: "0px 4px" }}>{s.fields_count} fields</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* OVERALL SUBMISSION METRICS & CHARTS */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20, marginBottom: 24 }}>
                    {/* Score Card & Doughnut */}
                    <div className="card" style={{ padding: 20 }}>
                      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Similarity Score: <span style={{ color: "var(--primary)" }}>{submissionComparisonData.metrics.similarity_pct}%</span></h3>
                      <p className="muted small" style={{ marginBottom: 16 }}>
                        Matching fields: <strong>{submissionComparisonData.metrics.matching_fields}</strong> | Differing fields: <strong>{submissionComparisonData.metrics.differing_fields}</strong>
                      </p>
                      <div style={{ maxWidth: 220, margin: "0 auto" }}>
                        <Doughnut
                          data={{
                            labels: ["Matching Fields", "Differing Fields"],
                            datasets: [
                              {
                                data: [
                                  submissionComparisonData.metrics.matching_fields,
                                  submissionComparisonData.metrics.differing_fields,
                                ],
                                backgroundColor: ["#22c55e", "#ef4444"],
                              },
                            ],
                          }}
                          options={{ responsive: true }}
                        />
                      </div>
                    </div>

                    {/* Numeric Fields Side-by-Side Comparison Chart */}
                    {submissionComparisonData.numeric_comparisons?.length > 0 && (
                      <div className="card" style={{ padding: 20 }}>
                        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
                          {selectedSubSectionTitle === "ALL" ? "Numeric Questions Comparison" : `Numeric Questions (${selectedSubSectionTitle})`}
                        </h3>
                        <Bar
                          data={{
                            labels: submissionComparisonData.numeric_comparisons
                              .filter((nc: any) => selectedSubSectionTitle === "ALL" || nc.section_title === selectedSubSectionTitle)
                              .map((nc: any) => nc.label),
                            datasets: submissionComparisonData.submissions.map((sub: any, idx: number) => {
                              const colors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];
                              const color = colors[idx % colors.length];
                              return {
                                label: sub.dept_name,
                                data: submissionComparisonData.numeric_comparisons
                                  .filter((nc: any) => selectedSubSectionTitle === "ALL" || nc.section_title === selectedSubSectionTitle)
                                  .map((nc: any) => nc.values[sub.id] || 0),
                                backgroundColor: color,
                                borderRadius: 4,
                              };
                            }),
                          }}
                          options={{ responsive: true }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Side-by-Side Matrix Table */}
                  <div className="card" style={{ padding: 20, overflowX: "auto" }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16 }}>
                      {selectedSubSectionTitle === "ALL" ? "Field-by-Field Comparison Matrix" : `Section: ${selectedSubSectionTitle} Comparison Matrix`}
                    </h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)", background: "var(--surface-elevated, #f8fafc)" }}>
                          <th style={{ padding: 12, width: "250px" }}>Field / Question</th>
                          {submissionComparisonData.submissions.map((sub: any) => (
                            <th key={sub.id} style={{ padding: 12, minWidth: "200px" }}>
                              <div style={{ fontWeight: 700 }}>{sub.dept_name}</div>
                              <div style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--muted)" }}>
                                {sub.user_name || sub.user_email} • Edits: {sub.edit_history_count}
                              </div>
                            </th>
                          ))}
                          <th style={{ padding: 12, width: "100px", textAlign: "center" }}>Match</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionComparisonData.field_comparison
                          .filter((f: any) => selectedSubSectionTitle === "ALL" || f.section_title === selectedSubSectionTitle)
                          .map((f: any) => (
                            <tr
                              key={f.field_id}
                              style={{
                                borderBottom: "1px solid var(--border)",
                                background: f.is_match ? "transparent" : "rgba(239, 68, 68, 0.04)"
                              }}
                            >
                              <td style={{ padding: 12 }}>
                                <strong style={{ display: "block", fontSize: "0.9rem" }}>{f.label}</strong>
                                <span className="muted small">{f.section_title} ({f.field_type})</span>
                              </td>

                              {submissionComparisonData.submissions.map((sub: any) => {
                                const val = f.values[sub.id] || "—";
                                return (
                                  <td key={sub.id} style={{ padding: 12, fontSize: "0.9rem" }}>
                                    <span style={{ fontWeight: f.is_match ? 400 : 600, color: f.is_match ? "inherit" : "#dc2626" }}>
                                      {val || <em className="muted">Empty</em>}
                                    </span>
                                  </td>
                                );
                              })}

                              <td style={{ padding: 12, textAlign: "center" }}>
                                {f.is_match ? (
                                  <CheckCircle2 color="#16a34a" size={18} />
                                ) : (
                                  <XCircle color="#dc2626" size={18} />
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: GROWTH & BASIC REPORTING */}
      {activeTab === "growth" && (
        <div>
          {!selectedFormId ? (
            <p className="muted">Please select a form from the top right dropdown.</p>
          ) : isGrowthLoading ? (
            <div style={{ padding: 40, textAlign: "center" }}>Computing submission growth curves and velocity...</div>
          ) : growthData ? (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>Submission Growth & Velocity Reporting</h2>
                <p className="muted">Track cumulative growth trajectories and monthly submission momentum.</p>
              </div>

              {/* Cumulative Growth Chart */}
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>Cumulative Submission Curve</h3>
                {growthData.cumulative_growth?.length > 0 ? (
                  <Line
                    data={{
                      labels: growthData.cumulative_growth.map((g: any) => g.date_str),
                      datasets: [
                        {
                          label: "Cumulative Submissions",
                          data: growthData.cumulative_growth.map((g: any) => g.cumulative),
                          borderColor: "#10b981",
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          fill: true,
                          tension: 0.2,
                        },
                      ],
                    }}
                    options={{ responsive: true }}
                  />
                ) : (
                  <p className="muted">No submission growth points recorded yet.</p>
                )}
              </div>

              {/* Monthly Momentum Table */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>Monthly Velocity & Growth Rate Report</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)" }}>
                        <th style={{ padding: 12 }}>Month Period</th>
                        <th style={{ padding: 12 }}>Submissions</th>
                        <th style={{ padding: 12 }}>MoM Growth Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {growthData.monthly_growth_rate?.map((m: any) => (
                        <tr key={m.month_year} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: 12, fontWeight: 600 }}>{m.month_year}</td>
                          <td style={{ padding: 12 }}>{m.monthly_count}</td>
                          <td style={{ padding: 12, fontWeight: 700, color: m.growth_rate_pct >= 0 ? "#16a34a" : "#dc2626" }}>
                            {m.growth_rate_pct >= 0 ? `+${m.growth_rate_pct}%` : `${m.growth_rate_pct}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">No growth reporting data available.</p>
          )}
        </div>
      )}
    </div>
  );
}
