const express = require("express");
const { createTask, approveTask, updateTask, deleteTask, getAdminDashboardStats, getUserDashboardStats, getAllTask, getTaskById, getWeeklyTaskStats, getAllUserPerformance } = require("../controllers/taskControllers");
const { protect } = require("../middlewares/authMiddlewares");

const router = express.Router();

// Tambahkan route sesuai kontroller
router.get("/", protect, getAllTask);
router.get("/admin-dashboard", protect, getAdminDashboardStats);
router.get("/user-dashboard", protect, getUserDashboardStats);
router.get("/weekly-task", protect,getWeeklyTaskStats);
router.get("/user-performance", protect, getAllUserPerformance);
router.get("/:taskId", getTaskById);

router.post("/create", protect, createTask);

router.patch("/approve/:taskId", protect, approveTask);
router.patch("/update/:taskId", protect, updateTask);

router.delete("/delete/:taskId", protect, deleteTask);


module.exports = router;
