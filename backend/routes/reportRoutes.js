const express = require("express");
const { protect } = require("../middlewares/authMiddlewares");
const { exportSuratPengantarPDF, getExportSummaryTasks } = require("../controllers/reportControllers");

const router = express.Router();

// Tambahkan route sesuai kontroller
router.post("/export-selected", protect, exportSuratPengantarPDF)
router.get("/export-summary", protect, getExportSummaryTasks)

module.exports = router;