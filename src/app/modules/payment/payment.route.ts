import { Router } from "express";
import auth from "../../middlewares/auth";
import { PaymentController } from "./payment.controller";

const router = Router();
router.get("/get-transactions", auth("SUPER_ADMIN"), PaymentController.recentTransactions);
router.get("/webhook", PaymentController.webhook);
router.get(
  "/update-subscription-webhook",
  PaymentController.updateSubscriptionVerifyPaymentWithWebhook,
);
router.get("/get-payment/:userId", auth("SUPER_ADMIN", "USER"), PaymentController.getPayment);


router.get("/:id", auth("SUPER_ADMIN"), PaymentController.singleTransaction);


//router.post(
//  "/create-payment-link",
//  validateRequest(PaymentValidations.paymentLinkValidation),
//  PaymentController.createPaymentLink,
//);

export const PaymentRoutes = router;
