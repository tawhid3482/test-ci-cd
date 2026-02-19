import { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import { catchAsync } from "../../utils/catchAsync";

export const saveToken = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { token, platform } = req.body;

  await NotificationService.saveDeviceToken(userId, token, platform);

  res.json({
    success: true,
    message: "Device token saved",
  });
});

export const sendNotificationByRole = catchAsync(async (req, res) => {
  await NotificationService.sendNotificationByAudience(req.body);

  res.json({
    success: true,
    message: "Notification sent successfully",
  });
});

export const sendTestNotification = catchAsync(async (req, res) => {
  await NotificationService.notifyUser(req.params.userId as string, {
    title: "Hello",
    body: "Test notification",
    data: { type: "test" },
  });

  res.json({ success: true });
});

export const getUserNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const notifications = await NotificationService.getUserNotifications(userId);

  res.json({
    success: true,
    data: notifications,
    count: notifications.length,
  });
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { userNotificationId } = req.params;
  const userId = req.user?.id as string;
  const isUpdated = await NotificationService.markNotificationAsRead(
    userNotificationId as string,
    userId,
  );

  if (!isUpdated) {
    res.status(404).json({
      success: false,
      message: "Notification not found",
    });
    return;
  }

  res.json({
    success: true,
    message: "Notification marked as read",
  });
});

export const syncPendingNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  await NotificationService.sendPendingNotifications(userId);

  res.json({
    success: true,
    message: "Pending notifications synced",
  });
});
