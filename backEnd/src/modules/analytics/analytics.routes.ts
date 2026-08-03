import { Router } from "express";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";
import {
  getOverviewAnalytics,
  getFormOverviewAnalytics,
  getYearWiseComparison,
  getQuestionWiseComparison,
  getSubmissionWiseComparison,
  getGrowthReporting
} from "./analytics.controller.js";

const router = Router();

// Protect all analytics endpoints with ADMIN authorization
router.use(authenticate, authorizeRoles("ADMIN"));

router.get("/overview", getOverviewAnalytics);
router.get("/forms/:formId/overview", getFormOverviewAnalytics);
router.get("/forms/:formId/year-comparison", getYearWiseComparison);
router.get("/forms/:formId/question-comparison", getQuestionWiseComparison);
router.get("/forms/:formId/submission-comparison", getSubmissionWiseComparison);
router.get("/forms/:formId/growth", getGrowthReporting);

export default router;
