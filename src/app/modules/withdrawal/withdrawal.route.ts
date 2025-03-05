import { Router } from "express";
import auth from "../../middlewares/auth";
import { WithdrawalController } from "./withdrawal.controller";
import validateRequest from "../../middlewares/validateRequest";
import { WithdrawalValidations } from "./withdrawal.validation";

const router = Router();
router.get("/withdrawals", auth("SUPER_ADMIN"), WithdrawalController.getWithdrawal);
router.get("/my-withdrawals", auth("USER"), WithdrawalController.getMyWithdrawal);
router.post(
  "/create",
  auth("USER"),
  validateRequest(WithdrawalValidations.createWithdrawalValidationSchema),
  WithdrawalController.createWithdrawal,
);

router.patch("/make-payment/:id", auth("USER"), WithdrawalController.makePayment);

export const WithdrawalRoutes = router;
