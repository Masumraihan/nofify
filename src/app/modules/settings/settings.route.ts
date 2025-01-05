import { Router } from "express";
import auth from "../../middlewares/auth";
import { SettingsControllers } from "./settings.controller";
import validateRequest from "../../middlewares/validateRequest";
import { SettingsValidations } from "./settings.validation";

const router = Router();
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

export const SettingsRoutes = router;
