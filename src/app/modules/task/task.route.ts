import { Router } from "express";
import auth from "../../middlewares/auth";
import multer, { memoryStorage } from "multer";
import { uploadManyToS3 } from "../../constant/s3";
import { createId } from "@paralleldrive/cuid2";
import { TaskValidation } from "./task.validation";
import { TaskController } from "./task.controller";
const storage = memoryStorage();
const upload = multer({ storage });

const router = Router();
router.post(
  "/create",
  auth("USER"),
  upload.fields([{ name: "files", maxCount: 5 }]),
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];
      const data = req.body;

      if (files.length) {
        const payload = files.map((file: Express.Multer.File) => {
          const path = `nofify/documents/${createId()}`;
          return {
            path,
            file: file.buffer,
          };
        });

        const documents = await uploadManyToS3(payload);
        if (data) {
          const taskData = TaskValidation.createTaskValidationSchema.parse({
            ...JSON.parse(data),
            documents,
          });

          req.body = taskData;
        } else {
          const taskData = TaskValidation.createTaskValidationSchema.parse({
            ...JSON.parse(req.body),
            documents,
          });

          req.body = taskData;
        }
        next();
      } else {
        if (data) {
          const taskData = TaskValidation.createTaskValidationSchema.parse({
            ...JSON.parse(data),
          });
          req.body = taskData;
        }

        next();
      }
    } catch (error) {
      next(error);
    }
  },
  TaskController.createTask,
);
router.patch(
  "/update/:id",
  auth("USER"),
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];
      const data = req.body;

      if (files.length) {
        const payload = files.map((file: Express.Multer.File) => {
          const path = `nofify/documents/${createId()}`;
          return {
            path,
            file: file.buffer,
          };
        });
      }

      if (data) {
        const taskData = TaskValidation.updateTaskValidationSchema.parse({
          ...JSON.parse(data),
        });
        req.body = taskData;
      } else {
        const taskData = TaskValidation.updateTaskValidationSchema.parse({
          ...JSON.parse(req.body),
        });
        req.body = taskData;
      }

      next();
    } catch (error) {
      next(error);
    }
  },
  TaskController.updateTask,
);

router.delete("/delete/:id", auth("USER"), TaskController.deleteTask);

export const TaskRoutes = router;
