import { Router } from "express";
import auth from "../../middlewares/auth";
import { AssignTaskControllers } from "./assignTask.controller";
import { AssignTaskValidations } from "./assignTask.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();
router.get("/tasks", auth("USER"), AssignTaskControllers.getAssignTasks);
router.get("/my-tasks", auth("USER"), AssignTaskControllers.myAssignTasks);
router.post(
  "/create",
  auth("USER"),
  validateRequest(AssignTaskValidations.crateAssignTaskValidation),
  AssignTaskControllers.createAssignTask,
);
router.patch(
  "/update/:id",
  auth("USER"),
  validateRequest(AssignTaskValidations.updateAssignTaskValidation),
  AssignTaskControllers.updateAssignTask,
);

router.patch(
  "/update-status/:id",
  validateRequest(AssignTaskValidations.updateAssignTaskStatus),
  AssignTaskControllers.updateAssignTaskStatus,
);

router.delete("/delete/:id", auth("USER"), AssignTaskControllers.deleteAssignTask);

export const SubscriptionRoutes = router;
