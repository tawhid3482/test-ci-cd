// // src/modules/notification/notification.service.ts
// import { PrismaClient } from "@prisma/client";
// import { firebaseAdmin } from "../../config/firebase";
// const prisma = new PrismaClient();

// const sendPush = async (tokens: string[], payload: any) => {
  

//   if (!tokens.length) return;

//   await firebaseAdmin.messaging().sendEachForMulticast({
//     tokens,
//     notification: {
//       title: payload.title,
//       body: payload.body,
//     },
//     data: payload.data || {},
//   });
// };

// const saveDeviceToken = async (
//   userId: string,
//   token: string,
//   platform?: string
// ) => {
//   await prisma.deviceToken.upsert({
//     where: { token },
//     update: { userId, platform },
//     create: { userId, token, platform },
//   });
// };



// const notifyUser = async (userId: string, payload: { title: string; body: string; data?: any }) => {
//   const tokens = await prisma.deviceToken.findMany({
//     where: { userId },
//     select: { token: true },
//   });

//   const tokenList = tokens.map(t => t.token);

//   if (!tokenList.length) {
//     console.log("No device tokens for user:", userId);
//     return;
//   }

//   await sendPush(tokenList, payload);
// };


// export const NotificationService = {
//   sendPush,
//   saveDeviceToken,
//   notifyUser
// };



// src/modules/notification/notification.service.ts
import { PrismaClient } from "@prisma/client";
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
  type: any;
  target_audience: any;
}) => {
  // 🔹 save notification in DB
  const notification = await prisma.notification.create({
    data: {
      title: payload.title,
      message: payload.message,
      type: payload.type,
      status: "active",
      target_audience: payload.target_audience,
    },
  });

  // 🔹 find users by role
  const users =
    payload.target_audience === "All"
      ? await prisma.user.findMany()
      : await prisma.user.findMany({
          where: { role: payload.target_audience },
        });

  if (!users.length) return;

  // 🔹 get tokens
  const tokens = await prisma.deviceToken.findMany({
    where: {
      userId: { in: users.map(u => u.id) },
    },
    select: { token: true },
  });

  const tokenList = tokens.map(t => t.token);

  if (!tokenList.length) return;

  // 🔹 push
  await firebaseAdmin.messaging().sendEachForMulticast({
    tokens: tokenList,
    notification: {
      title: payload.title,
      body: payload.message,
    },
    data: {
      type: payload.type,
      notificationId: notification.id,
    },
  });
};

const notifyUser = async (
  userId: string,
  payload: { title: string; body: string; data?: any },
) => {
  const tokens = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (!tokens.length) return;

  await firebaseAdmin.messaging().sendEachForMulticast({
    tokens: tokens.map(t => t.token),
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data ?? {},
  });
};

export const NotificationService = {
  saveDeviceToken,
  sendNotificationByAudience,
  notifyUser,
};
