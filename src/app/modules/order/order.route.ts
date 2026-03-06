import { Router } from "express";
import { Role } from "@prisma/client";
import { auth } from "../../middlewares/authMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { orderController } from "./order.controller";
import { createOrderSchema, updateOrderStatusSchema } from "./order.validation";

const router = Router();

router.post("/checkout", auth(), validateRequest(createOrderSchema), orderController.createOrderFromCart);
router.post("/:orderId/payments/ssl/init", auth(), orderController.initSslPayment);
router.all("/payments/ssl/success", orderController.sslPaymentSuccess);
router.all("/payments/ssl/fail", orderController.sslPaymentFail);
router.get("/me/stats", auth(), orderController.getMyOrderStats);
router.get("/me", auth(), orderController.getMyOrders);
router.get("/admin/stats", auth(Role.ADMIN, Role.SUPER_ADMIN), orderController.getAdminStats);
router.get("/", auth(Role.ADMIN, Role.SUPER_ADMIN), orderController.getAllOrders);
router.patch(
  "/:orderId/status",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);

export const orderRoute = router;
