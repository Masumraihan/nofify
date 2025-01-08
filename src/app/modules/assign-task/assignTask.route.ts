import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { SubscriptionController } from "./assignTask.controller";
import { SubscriptionValidation } from "./assignTask.validation";
import auth from "../../middlewares/auth";

const router = Router();
router.get("/subscriptions", auth("USER"), SubscriptionController.getSubscription);
router.post(
  "/create",
  auth("USER"),
  validateRequest(SubscriptionValidation.createSubscriptionSchema),
  SubscriptionController.createSubscription,
);

router.patch(
  "/update",
  auth("USER"),
  validateRequest(SubscriptionValidation.updateSubscription),
  SubscriptionController.updateSubscription,
);
router.patch("/cancel", auth("USER"), SubscriptionController.cancelSubscription);

export const SubscriptionRoutes = router;
