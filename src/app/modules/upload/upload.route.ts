import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import multer, { memoryStorage } from "multer";
import { uploadManyToS3, uploadWithProgress } from "../../constant/s3";
import AppError from "../../errors/AppError";
import auth from "../../middlewares/auth";
import sendResponse from "../../shared/sendResponse";
import { CustomRequest } from "../../types/common";
import { UploadController } from "./upload.controller";
import { createId } from "@paralleldrive/cuid2";

const storage = memoryStorage();
const upload = multer({ storage });
const router = Router();

router.post(
  "/images",
  auth("SUPER_ADMIN", "USER"),
  upload.array("files"),
  async (req, res, next) => {
    try {
      if (req?.files && req?.files?.length) {
        const payload = (req.files as any[]).map((file: Express.Multer.File) => {
          const path = `nofify/documents/${createId()}`;
          return {
            path,
            file: file.buffer,
          };
        });

        const res = await uploadManyToS3(payload);
        req.body = JSON.stringify(res);
        next();
      }
    } catch (error) {
      next(error);
    }
  },
  UploadController.uploadImages,
);

router.post(
  "/video",
  auth("SUPER_ADMIN", "USER"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const file = req.file;
      const fileName = `mpfofu/videos/${Math.floor(100000 + Math.random() * 900000)}`;
      if (file) {
        const user = (req as CustomRequest).user;
        const fileUrl = await uploadWithProgress({ file, fileName }, (progress) => {
          //io.to(user.id).emit("progress::" + user.id, { progress });
          //res.write(JSON.stringify({ progress }));
        });
        sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: "File uploaded successfully",
          data: { fileUrl },
        });
      } else {
        next(new AppError(StatusCodes.FAILED_DEPENDENCY, "File not found"));
      }
    } catch (error) {
      next(error);
    }
  },
);

export const UploadRoutes = router;
