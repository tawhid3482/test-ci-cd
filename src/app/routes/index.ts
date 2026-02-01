import { Router } from "express";
import { AuthRoute } from "../modules/auth/auth.route";
import { userRoute } from "../modules/user/user.route";
import { webSettingRoute } from "../modules/auth/websetting/webSetting.route";

const router = Router();

const modules = [
  {
    path: "/auth",
    route: AuthRoute,
  },
  {
    path: "/user",
    route: userRoute,
  },
  {
    path: "/settings",
    route: webSettingRoute,
  },
];

modules.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
