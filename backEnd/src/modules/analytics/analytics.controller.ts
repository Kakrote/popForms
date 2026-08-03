import { Request, Response, NextFunction } from "express";
import logger from "../../utils/logger.js";
import {
  fetchOverviewData,
  fetchFormOverviewData,
  fetchYearComparisonData,
  fetchQuestionComparisonData,
  fetchSubmissionComparisonData,
  fetchGrowthData,
} from "./analytics.service.js";

const getAnalyticsServiceUrl = () => {
  return process.env.ANALYTICS_SERVICE_URL || "http://localhost:8000";
};

export const getOverviewAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = await fetchOverviewData();
    const serviceUrl = getAnalyticsServiceUrl();
    const response = await fetch(`${serviceUrl}/api/analytics/overview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: "Analytics service error", error: errorText });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Failed to fetch overview analytics from Python service:", error);
    return res.status(500).json({ message: "Failed to connect to analytics service", error: error.message });
  }
};

export const getFormOverviewAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const payload = await fetchFormOverviewData(formId);
    if (!payload) {
      return res.status(404).json({ message: "Form not found" });
    }

    const serviceUrl = getAnalyticsServiceUrl();
    const response = await fetch(`${serviceUrl}/api/analytics/forms/overview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: "Analytics service error", error: errorText });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Failed to fetch form overview analytics:", error);
    return res.status(500).json({ message: "Failed to connect to analytics service", error: error.message });
  }
};

export const getYearWiseComparison = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const payload = await fetchYearComparisonData(formId);
    const serviceUrl = getAnalyticsServiceUrl();
    const response = await fetch(`${serviceUrl}/api/analytics/forms/year-comparison`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: "Analytics service error", error: errorText });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Failed to fetch year-wise comparison analytics:", error);
    return res.status(500).json({ message: "Failed to connect to analytics service", error: error.message });
  }
};

export const getQuestionWiseComparison = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const payload = await fetchQuestionComparisonData(formId);
    const serviceUrl = getAnalyticsServiceUrl();
    const response = await fetch(`${serviceUrl}/api/analytics/forms/question-comparison`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: "Analytics service error", error: errorText });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Failed to fetch question-wise comparison analytics:", error);
    return res.status(500).json({ message: "Failed to connect to analytics service", error: error.message });
  }
};

export const getSubmissionWiseComparison = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const ids = req.query.ids as string;
    if (!ids) {
      return res.status(400).json({ message: "Submission IDs parameter 'ids' is required" });
    }

    const submissionIds = ids.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = await fetchSubmissionComparisonData(formId, submissionIds);

    const serviceUrl = getAnalyticsServiceUrl();
    const response = await fetch(`${serviceUrl}/api/analytics/forms/submission-comparison`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: "Analytics service error", error: errorText });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Failed to fetch submission-wise comparison analytics:", error);
    return res.status(500).json({ message: "Failed to connect to analytics service", error: error.message });
  }
};

export const getGrowthReporting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const payload = await fetchGrowthData(formId);

    const serviceUrl = getAnalyticsServiceUrl();
    const response = await fetch(`${serviceUrl}/api/analytics/forms/growth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: "Analytics service error", error: errorText });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Failed to fetch growth reporting analytics:", error);
    return res.status(500).json({ message: "Failed to connect to analytics service", error: error.message });
  }
};
