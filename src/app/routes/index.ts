import { Router } from "express";
import { AuthRoute } from "../modules/auth/auth.route";


 const router = Router();

const modules = [
  {
    path: "/auth",
    route: AuthRoute,
  },


];

modules.forEach((route) => {
  router.use(route.path, route.route);
});


export default router;
