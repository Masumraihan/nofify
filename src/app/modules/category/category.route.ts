import { Router } from "express";
import auth from "../../middlewares/auth";
import { CategoryControllers } from "./category.controller";

const router = Router();

router.get("/categories", auth("USER", "SUPER_ADMIN"), CategoryControllers.getAllCategory);
router.get("/my-categories", auth("USER"), CategoryControllers.getMyCategories);

router.get("/sub-categories", auth("USER", "SUPER_ADMIN"), CategoryControllers.getAllSubCategory);
router.get("/my-sub-categories", auth("USER"), CategoryControllers.getMySubCategories);

router.post("/create", auth("SUPER_ADMIN", "USER"), CategoryControllers.createCategory);
router.post(
  "/create-sub-category",
  auth("SUPER_ADMIN", "USER"),
  CategoryControllers.createSubCategory,
);
router.patch("/update/:id", auth("SUPER_ADMIN"), CategoryControllers.updateCategory);
router.patch(
  "/update-sub-category/:id",
  auth("SUPER_ADMIN"),
  CategoryControllers.updateSubCategory,
);
router.delete("/delete/:id", auth("SUPER_ADMIN"), CategoryControllers.deleteCategory);
router.delete(
  "/delete-sub-category/:id",
  auth("SUPER_ADMIN"),
  CategoryControllers.deleteSubCategory,
);
export const CategoryRoutes = router;
