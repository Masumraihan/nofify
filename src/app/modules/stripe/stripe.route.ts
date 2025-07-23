import { Router } from "express";
import express from "express";
import { StripeController } from "./stripe.controller";
import auth from "../../middlewares/auth";

const router = Router();
router.get("/subscription", auth("USER"), StripeController.getPaymentLinkForProduct);
//router.post("/webhook", express.raw({ type: "application/json" }), StripeController.webhook);

export const StripeRoutes = router;
