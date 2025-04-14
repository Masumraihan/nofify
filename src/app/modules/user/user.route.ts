import express from "express";
import multer, { memoryStorage } from "multer";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { UserValidations } from "./user.validation";
import { uploadToS3 } from "../../constant/s3";
import { createId } from "@paralleldrive/cuid2";

const storage = memoryStorage();
const upload = multer({ storage });
const router = express.Router();

router.get("/users", auth("SUPER_ADMIN", "USER"), UserControllers.getUsers);
router.get("/profile", auth("SUPER_ADMIN", "USER"), UserControllers.getMyProfile);
router.get("/code/:referralCode", auth("SUPER_ADMIN"), UserControllers.getUserUsingReferralCode);
router.get("/:id", auth("SUPER_ADMIN"), UserControllers.getUser);
router.post("/check-user", UserControllers.checkUserExist);
router.patch(
  "/profile",
  auth("SUPER_ADMIN", "USER"),
  upload.single("profilePicture"),
  async (req, res, next) => {
    try {
      let profilePicture = null;

      // If a profile picture is uploaded, upload it to S3
      if (req.file) {
        profilePicture = await uploadToS3({
          file: req.file,
          fileName: `nofify/users/${createId()}`,
        });
      }

      const parsedData = req.body?.data ? JSON.parse(req.body?.data) : req.body;

      if (profilePicture) {
        req.body = UserValidations.updateProfileValidationSchema.parse({
          ...parsedData,
          profilePicture,
        });
      } else {
        req.body = UserValidations.updateProfileValidationSchema.parse({
          ...parsedData,
        });
      }

      // Proceed to the next middleware/controller
      next();
    } catch (error) {
      next(error);
    }
  },
  UserControllers.updateMyProfile,
);

router.patch(
  "/:id",
  auth("SUPER_ADMIN"),
  validateRequest(UserValidations.userSchema.partial()),
  UserControllers.updateUser,
);

router.delete("/user/:id", auth("SUPER_ADMIN"), UserControllers.deleteUser);

router.delete("/profile", auth("SUPER_ADMIN", "USER"), UserControllers.deleteMyProfile);

router.post(
  "/upload-image",
  auth("SUPER_ADMIN", "USER"),
  upload.single("file"),
  UserControllers.uploadImage,
);

export const UserRoutes = router;
