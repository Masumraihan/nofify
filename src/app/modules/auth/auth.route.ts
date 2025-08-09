import { Router } from "express";
import multer, { memoryStorage } from "multer";
import passport from "passport";
import { uploadManyToS3, uploadToS3 } from "../../constant/s3";
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
router.get("/success", AuthController.success);

router.post(
  "/sign-up",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  async (req, res, next) => {
    try {
      // Type assertion to ensure the structure of req.files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      // Upload profile picture if available
      const profilePicture = files?.["profilePicture"]
        ? await uploadToS3({
            file: files["profilePicture"][0],
            fileName: `nofify/users/${Math.floor(
              100000 + Math.random() * 900000 + new Date().getTime(),
            )}.${files["profilePicture"][0].originalname.split(".").pop()}`,
          })
        : "";

      // Upload documents if available
      const documents = files?.["documents"]?.length
        ? await Promise.all(
            await uploadManyToS3(
              files["documents"].map((file) => {
                const key = `nofify/docments/${Math.floor(
                  100000 + Math.random() * 900000 + new Date().getTime(),
                )}.${file.originalname.split(".").pop()}`;

                return {
                  file,
                  key,
                  path: key,
                };
              }),
            ),
          )
        : [];
      // Parse and validate the request body
      const parsedData = req.body?.data ? JSON.parse(req.body?.data) : req.body;

      req.body = AuthValidations.signUpValidation.parse({
        ...parsedData,
        profilePicture,
        documents,
      });

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
