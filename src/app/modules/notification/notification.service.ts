// // // src/modules/notification/notification.service.ts
// // import { PrismaClient } from "@prisma/client";
// // import { firebaseAdmin } from "../../config/firebase";
// // const prisma = new PrismaClient();

// // const sendPush = async (tokens: string[], payload: any) => {
  

// //   if (!tokens.length) return;

// //   await firebaseAdmin.messaging().sendEachForMulticast({
// //     tokens,
// //     notification: {
// //       title: payload.title,
// //       body: payload.body,
// //     },
// //     data: payload.data || {},
// //   });
// // };

// // const saveDeviceToken = async (
// //   userId: string,
// //   token: string,
// //   platform?: string
// // ) => {
// //   await prisma.deviceToken.upsert({
// //     where: { token },
// //     update: { userId, platform },
// //     create: { userId, token, platform },
// //   });
// // };



// // const notifyUser = async (userId: string, payload: { title: string; body: string; data?: any }) => {
// //   const tokens = await prisma.deviceToken.findMany({
// //     where: { userId },
// //     select: { token: true },
// //   });

// //   const tokenList = tokens.map(t => t.token);

// //   if (!tokenList.length) {
// //     console.log("No device tokens for user:", userId);
// //     return;
// //   }

// //   await sendPush(tokenList, payload);
// // };


// // export const NotificationService = {
// //   sendPush,
// //   saveDeviceToken,
// //   notifyUser
// // };



// // src/modules/notification/notification.service.ts
// import { PrismaClient } from "@prisma/client";
// import { firebaseAdmin } from "../../config/firebase";
//  const prisma = new PrismaClient();

// const saveDeviceToken = async (
//   userId: string,
//   token: string,
//   platform?: string,
// ) => {
//   await prisma.deviceToken.upsert({
//     where: { token },
//     update: { userId, platform },
//     create: { userId, token, platform },
//   });
// };

// const sendNotificationByAudience = async (payload: {
//   title: string;
//   message: string;
//   type: any;
//   target_audience: any;
// }) => {
//   // 🔹 save notification in DB
//   const notification = await prisma.notification.create({
//     data: {
//       title: payload.title,
//       message: payload.message,
//       type: payload.type,
//       status: "active",
//       target_audience: payload.target_audience,
//     },
//   });

//   // 🔹 find users by role
//   const users =
//     payload.target_audience === "All"
//       ? await prisma.user.findMany()
//       : await prisma.user.findMany({
//           where: { role: payload.target_audience },
//         });

//   if (!users.length) return;

//   // 🔹 get tokens
//   const tokens = await prisma.deviceToken.findMany({
//     where: {
//       userId: { in: users.map(u => u.id) },
//     },
//     select: { token: true },
//   });

//   const tokenList = tokens.map(t => t.token);

//   if (!tokenList.length) return;

//   // 🔹 push
//   await firebaseAdmin.messaging().sendEachForMulticast({
//     tokens: tokenList,
//     notification: {
//       title: payload.title,
//       body: payload.message,
//     },
//     data: {
//       type: payload.type,
//       notificationId: notification.id,
//     },
//   });
// };

// const notifyUser = async (
//   userId: string,
//   payload: { title: string; body: string; data?: any },
// ) => {
//   const tokens = await prisma.deviceToken.findMany({
//     where: { userId },
//     select: { token: true },
//   });

//   if (!tokens.length) return;

//   await firebaseAdmin.messaging().sendEachForMulticast({
//     tokens: tokens.map(t => t.token),
//     notification: {
//       title: payload.title,
//       body: payload.body,
//     },
//     data: payload.data ?? {},
//   });
// };

// export const NotificationService = {
//   saveDeviceToken,
//   sendNotificationByAudience,
//   notifyUser,
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
  // 1. প্রথমে ডাটাবেজে নোটিফিকেশন সেভ করুন
  const notification = await prisma.notification.create({
    data: {
      title: payload.title,
      message: payload.message,
      type: payload.type,
      status: "active",
      target_audience: payload.target_audience,
    },
  });

  // 2. টার্গেট ইউজারদের খুঁজে বের করুন
  const users =
    payload.target_audience === "All"
      ? await prisma.user.findMany()
      : await prisma.user.findMany({
          where: { role: payload.target_audience },
        });

  if (!users.length) return;

  // 3. প্রতিটি ইউজারের জন্য UserNotification রেকর্ড তৈরি করুন
  const userNotificationPromises = users.map(user =>
    prisma.userNotification.create({
      data: {
        userId: user.id,
        notificationId: notification.id,
        isRead: false,
      },
    }).catch(() => null) // যদি already exists হয়
  );

  await Promise.all(userNotificationPromises);

  // 4. শুধুমাত্র যেসব ইউজার অনলাইন (device token আছে) তাদেরকে push notification পাঠান
  const onlineUsers = await prisma.deviceToken.findMany({
    where: {
      userId: { in: users.map(u => u.id) },
    },
    select: { token: true, userId: true },
  });

  const tokenList = onlineUsers.map(t => t.token);
  
  if (tokenList.length > 0) {
    // 5. অনলাইন ইউজারদেরকে push notification পাঠান
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
  payload: { title: string; body: string; data?: any },
) => {
  // Direct notification (test এর জন্য)
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

const deleteOldReadNotifications = async () => {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 1);

  await prisma.userNotification.deleteMany({
    where: {
      isRead: true,
      createdAt: {
        lt: tenDaysAgo,
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

const markNotificationAsRead = async (userNotificationId: string) => {
  return await prisma.userNotification.update({
    where: { id: userNotificationId },
    data: { isRead: true },
  });
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
        createdAt: 'asc',
      },
      take: 10, // সর্বোচ্চ ১০টি নোটিফিকেশন
    });

    for (const userNotification of pendingNotifications) {
      const notification = userNotification.notification;
      
      await firebaseAdmin.messaging().sendEachForMulticast({
        tokens: deviceTokens.map(dt => dt.token),
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