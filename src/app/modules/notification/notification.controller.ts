// // src/modules/notification/notification.controller.ts
// import { Request, Response } from "express";
// import { NotificationService } from "./notification.service";
// import { catchAsync } from "../../utils/catchAsync";

// export const saveToken = catchAsync(async (req: Request, res: Response) => {
//   if (!req.params.userId) {
//     res.status(200).json({
//       success: false,
//       message: "User not authenticated",
//     });
//     return;
//   }
//   const userId = req.params.userId as string;
//   const { token, platform } = req.body;
//   console.log(req.body);

//   await NotificationService.saveDeviceToken(userId, token, platform);

//   res.status(200).json({
//     success: true,
//     message: "Device token saved",
//   });
// });

// // Test notification endpoint
// export const sendTestNotification = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.params.userId as string;

//   await NotificationService.notifyUser(userId, {
//     title: "Hello World!",
//     body: "This is a test notification from backend",
//     data: { type: "test" },
//   });

//   res.status(200).json({ success: true, message: "Notification sent" });
// });



// src/modules/notification/notification.controller.ts
import { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import { catchAsync } from "../../utils/catchAsync";

export const saveToken = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const { token, platform } = req.body;

  await NotificationService.saveDeviceToken(userId, token, platform);

  res.json({
    success: true,
    message: "Device token saved",
  });
});

// 🔐 ADMIN sends notification
export const sendNotificationByRole = catchAsync(async (req, res) => {
  await NotificationService.sendNotificationByAudience(req.body);

  res.json({
    success: true,
    message: "Notification sent successfully",
  });
});

// 🧪 Test single user
export const sendTestNotification = catchAsync(async (req, res) => {
  await NotificationService.notifyUser(req.params.userId as string, {
    title: "Hello 👋",
    body: "Test notification",
    data: { type: "test" },
  });

  res.json({ success: true });
});
