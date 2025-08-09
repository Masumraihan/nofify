import { Router } from "express";
import { MetaController } from "./meta.controller";
import auth from "../../middlewares/auth";

const router = Router();
router.get("/users", auth("SUPER_ADMIN"), MetaController.getUsersChartData);
router.get("/payments", auth("SUPER_ADMIN"), MetaController.paymentsChartData);
router.get("/earnings", auth("USER"), MetaController.myEarningChartData);
router.get("/counts", auth("SUPER_ADMIN"), MetaController.metaCounts);
router.get("/my-tasks-count", auth("USER"), MetaController.myTaskCount);

export const MetaRoutes = router;
