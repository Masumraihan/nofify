import express from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { MetaRoutes } from "../modules/meta/meta.route";
import { NotificationRoutes } from "../modules/notification/notification.route";
import { SettingsRoutes } from "../modules/settings/settings.route";
import { UploadRoutes } from "../modules/upload/upload.route";
import { UserRoutes } from "../modules/user/user.route";

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
