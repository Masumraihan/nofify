import { Router } from "express";
import auth from "../../middlewares/auth";
import { StripeController } from "./stripe.controller";

const router = Router();
router.get("/subscription", auth("USER"), StripeController.getPaymentLinkForProduct);
//router.post("/webhook", express.raw({ type: "application/json" }), StripeController.webhook);
router.patch("/cancel", auth("USER"), StripeController.cancelSubscription);

export const StripeRoutes = router;
