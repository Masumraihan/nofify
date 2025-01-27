import express from "express";
import { AssignTaskRoutes } from "../modules/assign-task/assignTask.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { CategoryRoutes } from "../modules/category/category.route";
import { MetaRoutes } from "../modules/meta/meta.route";
import { NotificationRoutes } from "../modules/notification/notification.route";
import { PackageRoutes } from "../modules/package/package.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { SettingsRoutes } from "../modules/settings/settings.route";
import { TaskRoutes } from "../modules/task/task.route";
import { UploadRoutes } from "../modules/upload/upload.route";
import { UserRoutes } from "../modules/user/user.route";
import { SubscriptionRoutes } from "../modules/subscription/subscription.route";
import { CoinsRoutes } from "../modules/coin/coins.route";

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
    path: "/assign-task",
    route: AssignTaskRoutes,
  },
  {
    path: "/coins",
    route: CoinsRoutes,
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
