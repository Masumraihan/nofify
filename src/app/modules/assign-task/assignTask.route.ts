import { Router } from "express";
import auth from "../../middlewares/auth";
import { AssignTaskControllers } from "./assignTask.controller";
import { AssignTaskValidations } from "./assignTask.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();
router.get("/my-tasks", auth("USER"), AssignTaskControllers.myTasks);
router.get("/my-assign-tasks", auth("USER"), AssignTaskControllers.myAssignTasks);
router.get("/:id", auth("USER"), AssignTaskControllers.assignTasksDetails);
router.post(
  "/create",
  auth("USER"),
  validateRequest(AssignTaskValidations.crateAssignTaskValidation),
  AssignTaskControllers.createAssignTask,
);
router.post(
  "/create-many",
  auth("USER"),
  validateRequest(AssignTaskValidations.crateManyAssignTaskValidation),
  AssignTaskControllers.createManyAssignTask,
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

export const AssignTaskRoutes = router;
