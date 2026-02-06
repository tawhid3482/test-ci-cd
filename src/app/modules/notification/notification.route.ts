// // src/modules/notification/notification.route.ts
// import { Router } from "express";
// import { saveToken, sendTestNotification } from "./notification.controller";

// const router = Router();

// router.post("/save-token/:userId", saveToken);
// router.post("/test/:userId", sendTestNotification); // test notification

// export const notificationRouter = router;


// src/modules/notification/notification.route.ts
import { Router } from "express";
import {
  saveToken,
  sendNotificationByRole,
  sendTestNotification,
} from "./notification.controller";

const router = Router();

router.post("/save-token/:userId", saveToken);

// 🔐 only ADMIN / MANAGER
router.post(
  "/send",
//   auth("ADMIN", "MANAGER"),
  sendNotificationByRole,
);

router.post("/test/:userId", sendTestNotification);

export const notificationRouter = router;
