import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionValidation } from "./subscription.validation";
import auth from "../../middlewares/auth";

const router = Router();
router.get("/subscriptions", auth("USER"), SubscriptionController.getSubscription);
router.get("/success", SubscriptionController.success);
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
