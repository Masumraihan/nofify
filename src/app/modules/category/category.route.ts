import { Router } from "express";
import auth from "../../middlewares/auth";
import { CategoryControllers } from "./category.controller";

const router = Router();

router.get("/categories", auth("USER", "SUPER_ADMIN"), CategoryControllers.getAllCategory);
router.get("/sub-categories", auth("USER", "SUPER_ADMIN"), CategoryControllers.getAllSubCategory);

export const CategoryRoutes = router;
