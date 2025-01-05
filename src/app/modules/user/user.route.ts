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

router.get("/users", auth("SUPER_ADMIN"), UserControllers.getUsers);
router.get("/profile", auth("SUPER_ADMIN", "USER"), UserControllers.getMyProfile);
router.get("/:id", auth("SUPER_ADMIN"), UserControllers.getUser);

router.patch(
  "/user/:id",
  auth("SUPER_ADMIN"),
  validateRequest(UserValidations.userSchema.partial()),
  UserControllers.updateUser,
);
router.delete("/user/:id", auth("SUPER_ADMIN"), UserControllers.deleteUser);
router.patch(
  "/profile",
  auth("SUPER_ADMIN", "USER"),
  upload.single("profilePicture"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const profilePicture = await uploadToS3({
          file: req.file,
          fileName: `task-management/users/${createId()}`,
        });
        if (req.body?.data) {
          req.body = UserValidations.updateProfileValidationSchema.parse({
            ...JSON.parse(req?.body?.data),
            profilePicture,
          });
        } else {
          req.body = UserValidations.updateProfileValidationSchema.parse({
            profilePicture,
          });
        }
      } else {
        if (req.body?.data) {
          req.body = UserValidations.updateProfileValidationSchema.parse(
            JSON.parse(req?.body?.data),
          );
        } else if (req.body) {
          req.body = UserValidations.updateProfileValidationSchema.parse(req.body);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  UserControllers.updateMyProfile,
);
router.delete("/profile", auth("SUPER_ADMIN", "USER"), UserControllers.deleteMyProfile);

router.post(
  "/upload-image",
  auth("SUPER_ADMIN", "USER"),
  upload.single("file"),
  UserControllers.uploadImage,
);

export const UserRoutes = router;
