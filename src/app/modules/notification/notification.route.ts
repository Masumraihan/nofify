import { Router } from "express";
import auth from "../../middlewares/auth";
import { NotificationControllers } from "./notification.controller";

const router = Router();

router.get("/notifications", auth("SUPER_ADMIN", "USER"), NotificationControllers.getNotification);
router.patch("/read", auth("SUPER_ADMIN", "USER"), NotificationControllers.readNotification);
router.delete("/", auth("SUPER_ADMIN", "USER"), NotificationControllers.deleteAllNotification);
router.delete("/:id", auth("SUPER_ADMIN", "USER"), NotificationControllers.deleteNotification);
export const NotificationRoutes = router;
