import {
  PrismaClient,
  notificationType,
  notification_audience,
} from "@prisma/client";
import { firebaseAdmin } from "../../config/firebase";

const prisma = new PrismaClient();

const saveDeviceToken = async (
  userId: string,
  token: string,
  platform?: string,
) => {
  await prisma.deviceToken.upsert({
    where: { token },
    update: { userId, platform },
    create: { userId, token, platform },
  });
};

const sendNotificationByAudience = async (payload: {
  title: string;
  message: string;
  type: notificationType;
  target_audience: notification_audience;
}) => {
  const notification = await prisma.notification.create({
    data: {
      title: payload.title,
      message: payload.message,
      type: payload.type,
      status: "active",
      target_audience: payload.target_audience,
    },
  });

  const users =
    payload.target_audience === "All"
      ? await prisma.user.findMany()
      : payload.target_audience === "ADMIN" || payload.target_audience === "MANAGER"
        ? await prisma.user.findMany({
            where: { role: payload.target_audience },
          })
        : [];

  if (!users.length) return;

  const userNotificationPromises = users.map((user) =>
    prisma.userNotification
      .create({
        data: {
          userId: user.id,
          notificationId: notification.id,
          isRead: false,
        },
      })
      .catch(() => null),
  );

  await Promise.all(userNotificationPromises);

  const onlineUsers = await prisma.deviceToken.findMany({
    where: {
      userId: { in: users.map((u) => u.id) },
    },
    select: { token: true },
  });

  const tokenList = onlineUsers.map((t) => t.token);

  if (tokenList.length > 0) {
    await firebaseAdmin.messaging().sendEachForMulticast({
      tokens: tokenList,
      notification: {
        title: payload.title,
        body: payload.message,
      },
      data: {
        type: payload.type,
        notificationId: notification.id,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    });
  }
};

const notifyUser = async (
  userId: string,
  payload: { title: string; body: string; data?: Record<string, string> },
) => {
  const tokens = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (!tokens.length) return;

  await firebaseAdmin.messaging().sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data ?? {},
  });
};

const deleteOldReadNotifications = async () => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  await prisma.userNotification.deleteMany({
    where: {
      isRead: true,
      createdAt: {
        lt: oneDayAgo,
      },
    },
  });
};

const getUserNotifications = async (userId: string) => {
  await deleteOldReadNotifications();

  return await prisma.userNotification.findMany({
    where: {
      userId,
      isRead: false,
    },
    include: {
      notification: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const markNotificationAsRead = async (
  userNotificationId: string,
  userId: string,
) => {
  const result = await prisma.userNotification.updateMany({
    where: { id: userNotificationId, userId },
    data: { isRead: true },
  });

  return result.count > 0;
};

const sendPendingNotifications = async (userId: string) => {
  try {
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (deviceTokens.length === 0) return;

    const pendingNotifications = await prisma.userNotification.findMany({
      where: {
        userId,
        isRead: false,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        notification: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 10,
    });

    for (const userNotification of pendingNotifications) {
      const notification = userNotification.notification;

      await firebaseAdmin.messaging().sendEachForMulticast({
        tokens: deviceTokens.map((dt) => dt.token),
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          type: notification.type,
          notificationId: notification.id,
          userNotificationId: userNotification.id,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      });

      await prisma.userNotification.update({
        where: { id: userNotification.id },
        data: { isRead: true },
      });
    }
  } catch (error) {
    console.error("Error sending pending notifications:", error);
  }
};

export const NotificationService = {
  saveDeviceToken,
  sendNotificationByAudience,
  notifyUser,
  getUserNotifications,
  markNotificationAsRead,
  sendPendingNotifications,
};
