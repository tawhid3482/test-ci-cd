import { Router } from "express";
import { AuthRoute } from "../modules/auth/auth.route";
import { userRoute } from "../modules/user/user.route";
import { webSettingRoute } from "../modules/websetting/webSetting.route";
import { contactRoute } from "../modules/contact/contact.route";
import { districtRoute } from "../modules/district/district.route";

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
  {
    path: "/contact",
    route: contactRoute,
  },
  {
    path: "/district",
    route: districtRoute,
  },
];

modules.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
