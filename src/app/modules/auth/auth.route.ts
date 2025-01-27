import { Router } from "express";
import multer, { memoryStorage } from "multer";
import passport from "passport";
import { uploadToS3 } from "../../constant/s3";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidations } from "./auth.validation";
const storage = memoryStorage();
const upload = multer({ storage });

const router = Router();
router.get("/refresh-token", AuthController.refreshToken);
router.get(
  "/google",
  AuthController.googleLogin,
  passport.authenticate("google", { scope: ["email", "profile"] }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  AuthController.googleCallback,
);

router.post(
  "/sign-up",
  upload.single("profilePicture"),
  async (req, res, next) => {
    try {
      if (req.file) {
        //const fileExtension = req.file.mimetype.split("/")[1] || "png";
        const profilePicture = await uploadToS3({
          file: req.file,
          fileName: `nofify/users/${Math.floor(100000 + Math.random() * 900000)}`,
        });
        if (req.body?.data) {
          req.body = AuthValidations.signUpValidation.parse({
            ...JSON.parse(req?.body?.data),
            profilePicture,
          });
        }
      } else {
        if (req.body?.data) {
          req.body = AuthValidations.signUpValidation.parse(JSON.parse(req?.body?.data));
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  AuthController.signUp,
);
router.post("/sign-in", validateRequest(AuthValidations.signInValidation), AuthController.signIn);

router.patch(
  "/change-password",
  auth("USER", "SUPER_ADMIN"),
  validateRequest(AuthValidations.changePasswordValidation),
  AuthController.changePassword,
);

router.post(
  "/forget-password",
  validateRequest(AuthValidations.forgetPasswordValidation),
  AuthController.forgetPassword,
);

router.post(
  "/reset-password",
  validateRequest(AuthValidations.resetPasswordValidation),
  AuthController.resetPassword,
);
router.post(
  "/verify-account",
  validateRequest(AuthValidations.optValidation),
  AuthController.verifyAccount,
);

router.post(
  "/resend-otp",
  validateRequest(AuthValidations.resendOtpValidation),
  AuthController.resendOtp,
);

export const AuthRoutes = router;
