import { Router } from "express";
import { MetaController } from "./meta.controller";
import auth from "../../middlewares/auth";

const router = Router();
router.get("/users", auth("SUPER_ADMIN"), MetaController.getUsersChartData);
router.get("/payments", auth("SUPER_ADMIN"), MetaController.paymentsChartData);
router.get("/counts", auth("SUPER_ADMIN"), MetaController.metaCounts);
export const MetaRoutes = router;
