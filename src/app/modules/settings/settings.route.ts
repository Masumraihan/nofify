import { Router } from "express";
import auth from "../../middlewares/auth";
import { SettingsControllers } from "./settings.controller";
import validateRequest from "../../middlewares/validateRequest";
import { SettingsValidations } from "./settings.validation";

const router = Router();
router.get("/task-remainder-minutes", SettingsControllers.getTaskRemainderMinutes);
router.get("/:label", SettingsControllers.getSettings);
router.post(
  "/create",
  auth("SUPER_ADMIN"),
  validateRequest(SettingsValidations.createSettingsValidation),
  SettingsControllers.createSettings,
);
router.patch(
  "/update",
  auth("SUPER_ADMIN"),
  validateRequest(SettingsValidations.updateSettingsValidation),
  SettingsControllers.updateSettings,
);

router.put(
  "/create-task-remainder-minutes",
  auth("SUPER_ADMIN"),
  validateRequest(SettingsValidations.updateTaskRemainderMinutesValidation),
  SettingsControllers.createTaskRemainderMinutes,
);
router.delete(
  "/delete-task-remainder-minutes/:id",
  auth("SUPER_ADMIN"),
  SettingsControllers.deleteTaskRemainderMinutes,
);
export const SettingsRoutes = router;
