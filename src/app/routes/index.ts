import express from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { MetaRoutes } from "../modules/meta/meta.route";
import { NotificationRoutes } from "../modules/notification/notification.route";
import { SettingsRoutes } from "../modules/settings/settings.route";
import { UploadRoutes } from "../modules/upload/upload.route";
import { UserRoutes } from "../modules/user/user.route";
import { PackageRoutes } from "../modules/package/package.route";
import { TaskRoutes } from "../modules/task/task.route";
import { SubscriptionRoutes } from "../modules/assign-task/assignTask.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { CategoryRoutes } from "../modules/category/category.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/package",
    route: PackageRoutes,
  },
  {
    path: "/subscription",
    route: SubscriptionRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/category",
    route: CategoryRoutes,
  },
  {
    path: "/task",
    route: TaskRoutes,
  },
  {
    path: "/upload",
    route: UploadRoutes,
  },
  {
    path: "/settings",
    route: SettingsRoutes,
  },
  {
    path: "/meta",
    route: MetaRoutes,
  },
  {
    path: "/notification",
    route: NotificationRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
