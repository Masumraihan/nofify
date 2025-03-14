import { Router } from "express";
import auth from "../../middlewares/auth";
import { CoinController } from "./coins.controller";
import { CoinValidations } from "./coin.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

router.get("/", auth("USER"), CoinController.getCoins);
router.post(
  "/send",
  auth("USER"),
  validateRequest(CoinValidations.sendCoinsSchema),
  CoinController.sendCoins,
);
router.post(
  "/redeem",
  auth("USER"),
  validateRequest(CoinValidations.redeemCoinsSchema),
  CoinController.redeemCoins,
);

export const CoinsRoutes = router;
