import { Router } from "express";
import { AuthRoute } from "../modules/auth/auth.route";
import { userRoute } from "../modules/user/user.route";
import { webSettingRoute } from "../modules/websetting/webSetting.route";
import { contactRoute } from "../modules/contact/contact.route";
import { notificationRouter } from "../modules/notification/notification.route";
import { categoryRoute } from "../modules/categories/categories.route";
import { ProductRoute } from "../modules/products/products.route";
import { cartRoute } from "../modules/cart/cart.route";
import { wishlistRoute } from "../modules/wishlist/wishlist.route";

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
    path: "/notification",
    route: notificationRouter,
  },
  {
    path: "/categories",
    route: categoryRoute,
  },
  {
    path: "/products",
    route: ProductRoute,
  },
  {
    path: "/cart",
    route: cartRoute,
  },
  {
    path: "/wishlist",
    route: wishlistRoute,
  },
];

modules.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
