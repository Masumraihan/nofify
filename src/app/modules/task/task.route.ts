import { Router } from "express";
import multer, { memoryStorage } from "multer";
import { uploadManyToS3 } from "../../constant/s3";
import auth from "../../middlewares/auth";
import { TaskController } from "./task.controller";
import { TaskValidation } from "./task.validation";
const storage = memoryStorage();
const upload = multer({ storage });

const router = Router();

router.get("/tasks", auth("SUPER_ADMIN", "USER"), TaskController.getTasks);
router.get("/my-tasks", auth("USER"), TaskController.getMyTasks);
router.get("/:id", auth("SUPER_ADMIN", "USER"), TaskController.getTaskById);
router.post(
  "/create",
  auth("USER"),
  upload.array("files", 5),
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];
      const data = req.body.data;

      if (files.length) {
        const payload = files.map((file: Express.Multer.File) => {
          const path = `nofify/documents`;
          const extension = file.originalname.split(".").pop();
          const fileKey = `${Math.floor(100000 + Math.random() * 900000)}${Date.now()}`;
          return {
            path,
            file: file.buffer,
            key: fileKey,
            extension,
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
      } else {
        if (data) {
          const taskData = TaskValidation.createTaskValidationSchema.parse({
            ...JSON.parse(data),
          });
          req.body = taskData;
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  TaskController.createTask,
);
router.post("/add-into-calender/:id", TaskController.addTaskIntoCalendar);
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
        const payload = files.map((file) => {
          const extension = file.originalname.split(".").pop();
          const fileKey = `${Math.floor(100000 + Math.random() * 900000)}${Date.now()}`;
          return {
            path: `nofify/documents`,
            file: file.buffer,
            extension,
            key: fileKey,
          };
        });

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
      next(error);
    }
  },
  TaskController.updateTask,
);
router.delete("/delete-add-task/:id", auth("USER"), TaskController.deleteAddTask);
router.delete("/delete/:id", auth("USER"), TaskController.deleteTask);
export const TaskRoutes = router;
