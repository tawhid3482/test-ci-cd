import { Router } from "express";
import { Role } from "@prisma/client";
import {
  saveToken,
  sendNotificationByRole,
  sendTestNotification,
  getUserNotifications,
  markAsRead,
  syncPendingNotifications,
} from "./notification.controller";
import { auth } from "../../middlewares/authMiddleware";

const router = Router();

router.post(
  "/save-token",
  auth(Role.USER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN),
  saveToken,
);

router.post("/send", auth(Role.ADMIN, Role.SUPER_ADMIN), sendNotificationByRole);
router.post("/test/:userId", auth(Role.ADMIN, Role.SUPER_ADMIN), sendTestNotification);

router.get(
  "/user",
  auth(Role.USER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN),
  getUserNotifications,
);

router.put(
  "/read/:userNotificationId",
  auth(Role.USER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN),
  markAsRead,
);

router.post(
  "/sync",
  auth(Role.USER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN),
  syncPendingNotifications,
);

export const notificationRouter = router;
