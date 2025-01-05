import { Router } from "express";
import auth from "../../middlewares/auth";
import { PackageController } from "./package.conroller";
import validateRequest from "../../middlewares/validateRequest";
import { PackageValidations } from "./package.validation";

const router = Router();

router.get("/packages", auth("SUPER_ADMIN"), PackageController.getPackages);
router.post(
  "/create",
  auth("SUPER_ADMIN"),
  validateRequest(PackageValidations.cratePackageValidation),
  PackageController.createPackage,
);

router.patch(
  "/update/:id",
  auth("SUPER_ADMIN"),
  validateRequest(PackageValidations.updatePackageValidation),
  PackageController.updatePackage,
);

router.delete("/delete/:id", auth("SUPER_ADMIN"), PackageController.deletePackage);

export const PackageRoutes = router;
