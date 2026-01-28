import { Router } from "express";
import { AuthRoute } from "../modules/auth/auth.route";
import { userRoute } from "../modules/user/user.route";

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
];

modules.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
