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
router.get("/tasks", auth("SUPER_ADMIN", "USER"), TaskController.getTasks);
router.get("/my-tasks", auth("USER"), TaskController.getMyTasks);
router.get("/:id", auth("SUPER_ADMIN", "USER"), TaskController.getTaskById);
router.post(
  "/create",
  auth("USER"),
  upload.fields([{ name: "files", maxCount: 5 }]),
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];
      const data = req.body.data;
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
          console.log(JSON.parse(data), "data");
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
  upload.fields([{ name: "files", maxCount: 5 }]),
  async (req, res, next) => {
    try {
      // Extract files and body data
      const files = (req as any).files?.["files"] as Express.Multer.File[] | undefined;
      const data = req.body?.data ? JSON.parse(req.body.data) : undefined;

      // Process uploaded files if any
      let documents: { url: string; key: string }[] = [];
      if (files?.length) {
        const payload = files.map((file) => ({
          path: `nofify/documents/${createId()}`,
          file: file.buffer,
        }));

        documents = await uploadManyToS3(payload);
      }

      // Prepare the validation payload
      const validationPayload = {
        ...data,
        ...(documents.length > 0 ? { documents } : {}),
      };

      // Validate and attach to request body
      const taskData = TaskValidation.updateTaskValidationSchema.parse(validationPayload);
      req.body = taskData;

      next();
    } catch (error) {
      console.error("Error in task update handler:", error);
      next(error);
    }
  },
  TaskController.updateTask,
);

router.delete("/delete/:id", auth("USER"), TaskController.deleteTask);

export const TaskRoutes = router;
