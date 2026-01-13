// import { Server } from "socket.io";
// import * as ChatService from "../modules/chat/chat.service";
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// export class SocketServer {
//   private static io: Server;
//   private static onlineUsers = new Map<
//     string,
//     { socketId: string; userId: string; userInfo?: any; lastActive: Date }
//   >();

//   static init(server: any) {
//     this.io = new Server(server, {
//       cors: {
//         origin: ["https://geniustutorss.com"],
//         methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//         credentials: true,
//       },
//       transports: ["websocket", "polling"],
//       pingTimeout: 60000,
//       pingInterval: 25000,
//       connectionStateRecovery: {
//         maxDisconnectionDuration: 2 * 60 * 1000,
//         skipMiddlewares: true,
//       },
//     });

//     this.setupConnection();
//   }

//   private static async setupConnection() {
//     this.io.on("connection", (socket) => {
//       let currentUserId: string | null = null;

//       // User joins their personal room and registers as online
//       socket.on("joinUser", async (userId: string) => {
//         if (!userId) {
//           console.error("❌ joinUser: userId is required");
//           return;
//         }

//         currentUserId = userId;

//         // Get user info from database
//         let userInfo = null;
//         try {
//           userInfo = await ChatService.getUserById(userId);
//         } catch (error) {
//           console.error("Error fetching user info:", error);
//         }

//         // Store user in online users map
//         this.onlineUsers.set(userId, {
//           socketId: socket.id,
//           userId: userId,
//           userInfo: userInfo || {
//             id: userId,
//             fullName: "User",
//             avatar: null,
//             role: "user",
//           },
//           lastActive: new Date(),
//         });

//         // Join user room
//         socket.join(`user_${userId}`);

//         // Get user's conversations with unseen counts
//         try {
//           const conversations = await ChatService.getConversationsWithUnseenCount(userId);
          
//           // Send conversations to user
//           socket.emit("conversationsUpdate", conversations);
          
//           // Get total unseen count
//           const totalUnseen = conversations.reduce((sum, conv) => sum + (conv.unseenCount || 0), 0);
//           socket.emit("totalUnseenCount", totalUnseen);
//         } catch (error) {
//           console.error("Error getting conversations:", error);
//         }

//         // Notify all other users that this user is online
//         socket.broadcast.emit("userOnline", {
//           userId: userId,
//           userInfo: userInfo || {
//             id: userId,
//             fullName: "User",
//             avatar: null,
//             role: "user",
//           },
//         });

//         // Send current user the list of all online users
//         const onlineUsersList = Array.from(this.onlineUsers.keys());
//         socket.emit("onlineUsersList", onlineUsersList);

//         // Store user info in socket
//         (socket as any).userId = userId;
//         (socket as any).userInfo = userInfo;
//       });

//       // User requests online users list
//       socket.on("requestOnlineUsers", () => {
//         if (currentUserId) {
//           const onlineUsersList = Array.from(this.onlineUsers.keys());
//           socket.emit("onlineUsersList", onlineUsersList);
//         }
//       });

//       // Handle heartbeat/ping from client
//       socket.on("heartbeat", (data: { userId: string; timestamp: number }) => {
//         if (data.userId && this.onlineUsers.has(data.userId)) {
//           // Update last active timestamp
//           const userData = this.onlineUsers.get(data.userId);
//           if (userData) {
//             this.onlineUsers.set(data.userId, {
//               ...userData,
//               socketId: socket.id,
//               lastActive: new Date(),
//             });
//           }
//         }
//       });

//       // Conversation room join
//       socket.on("joinConversation", async (conversationId: string) => {
//         if (!conversationId) {
//           console.error("❌ joinConversation: conversationId is required");
//           return;
//         }

//         socket.join(`conversation_${conversationId}`);

//         (socket as any).currentConversationId = conversationId;

//         // Mark messages as seen when user joins conversation
//         if (currentUserId) {
//           try {
//             await ChatService.markMessagesAsSeen(conversationId, currentUserId);
            
//             // Get updated conversations
//             const conversations = await ChatService.getConversationsWithUnseenCount(currentUserId);
//             socket.emit("conversationsUpdate", conversations);
            
//             // Get updated total unseen count
//             const totalUnseen = conversations.reduce((sum, conv) => sum + (conv.unseenCount || 0), 0);
//             socket.emit("totalUnseenCount", totalUnseen);
            
//             // Get messages that were marked as seen
//             const seenMessages = await prisma.message.findMany({
//               where: {
//                 conversationId,
//                 senderId: { not: currentUserId },
//                 isSeen: false,
//               },
//               select: {
//                 id: true,
//                 senderId: true,
//               },
//             });

//             // Notify senders that their messages have been seen
//             const seenMessageIds = seenMessages.map((msg:any) => msg.id);
//             const senderIds = [...new Set(seenMessages.map((msg:any) => msg.senderId))];
            
//             senderIds.forEach(senderId => {
//               this.io.to(`user_${senderId}`).emit("messagesSeen", {
//                 conversationId,
//                 messageIds: seenMessages
//                   .filter((msg:any) => msg.senderId === senderId)
//                   .map((msg:any) => msg.id),
//                 seenBy: currentUserId,
//                 seenAt: new Date().toISOString(),
//               });
//             });

//             // Update conversation for all members
//             const conversation = await prisma.conversation.findUnique({
//               where: { id: conversationId },
//               select: { members: true },
//             });

//             if (conversation) {
//               conversation.members.forEach((memberId:any) => {
//                 this.io.to(`user_${memberId}`).emit("conversationUpdated", {
//                   conversationId,
//                   updatedAt: new Date().toISOString(),
//                 });
//               });
//             }
//           } catch (error) {
//             console.error("Error marking messages as seen:", error);
//           }
//         }
//       });

//       // Leave conversation room
//       socket.on("leaveConversation", (conversationId: string) => {
//         socket.leave(`conversation_${conversationId}`);

//         if ((socket as any).currentConversationId === conversationId) {
//           (socket as any).currentConversationId = null;
//         }
//       });

//       // Send message
//     socket.on("sendMessage", async (data) => {
//   try {
//     if (!data.conversationId || !data.senderId || !data.text?.trim()) {
//       socket.emit("messageError", {
//         error: "Missing required fields",
//         tempId: data.tempId,
//       });
//       return;
//     }

//     // Save message to database with proper fields
//     const savedMessage = await prisma.message.create({
//       data: {
//         conversationId: data.conversationId,
//         senderId: data.senderId,
//         text: data.text.trim(),
//         isSeen: false, // Default false
//       },
//     });

//     // Fetch sender info separately
//     const sender = await prisma.user.findUnique({
//       where: { id: data.senderId },
//     });

//     // Update conversation's updatedAt
//     await prisma.conversation.update({
//       where: { id: data.conversationId },
//       data: { updatedAt: new Date() },
//     });

//     // Format the message response
//     const messageWithSender = {
//       id: savedMessage.id,
//       text: savedMessage.text,
//       senderId: savedMessage.senderId,
//       conversationId: savedMessage.conversationId,
//       isSeen: savedMessage.isSeen,
//       seenAt: savedMessage.seenAt,
//       createdAt: savedMessage.createdAt.toISOString(),
//       sender: sender || {
//         id: data.senderId,
//         fullName: "Unknown User",
//         avatar: null,
//         role: "user",
//       },
//     };

//     // Send confirmation to sender
//     socket.emit("messageSent", {
//       tempId: data.tempId,
//       realMessage: messageWithSender,
//     });

//     // Get conversation members
//     const conversation = await prisma.conversation.findUnique({
//       where: { id: data.conversationId },
//       select: { members: true },
//     });

//     if (!conversation) {
//       throw new Error("Conversation not found");
//     }

//     // Broadcast to conversation room (excluding sender)
//     socket
//       .to(`conversation_${data.conversationId}`)
//       .emit("receiveMessage", messageWithSender);

//     // Update unseen counts for all members
//     for (const memberId of conversation.members) {
//       if (memberId !== data.senderId) {
//         // Get updated unseen count for this member
//         const unseenCount = await prisma.message.count({
//           where: {
//             conversationId: data.conversationId,
//             senderId: { not: memberId },
//             isSeen: false,
//           },
//         });

//         // Send notification to member
//         this.io.to(`user_${memberId}`).emit("newMessageNotification", {
//           conversationId: data.conversationId,
//           message: messageWithSender,
//           sender: messageWithSender.sender,
//           unseenCount: unseenCount,
//         });

//         // Update their total unseen count
//         const allConversations = await prisma.conversation.findMany({
//           where: {
//             members: {
//               has: memberId,
//             },
//           },
//           select: { id: true },
//         });

//         let totalUnseen = 0;
//         for (const conv of allConversations) {
//           const count = await prisma.message.count({
//             where: {
//               conversationId: conv.id,
//               senderId: { not: memberId },
//               isSeen: false,
//             },
//           });
//           totalUnseen += count;
//         }

//         this.io.to(`user_${memberId}`).emit("totalUnseenCount", totalUnseen);
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error in sendMessage:", error);
//     socket.emit("messageError", {
//       error: error instanceof Error ? error.message : "Failed to send message",
//       tempId: data.tempId,
//     });
//   }
// });

//       // Typing indicator
//       socket.on(
//         "typing",
//         (data: {
//           conversationId: string;
//           userId: string;
//           isTyping: boolean;
//         }) => {
//           if (!data.conversationId || !data.userId) return;

//           socket.to(`conversation_${data.conversationId}`).emit("userTyping", {
//             userId: data.userId,
//             isTyping: data.isTyping,
//             conversationId: data.conversationId,
//             timestamp: new Date().toISOString(),
//           });
//         }
//       );

//       // Mark specific messages as seen
//       socket.on("markMessagesAsSeen", async (data: {
//         conversationId: string;
//         userId: string;
//         messageIds?: string[];
//       }) => {
//         try {
//           const { conversationId, userId, messageIds } = data;

//           if (messageIds && messageIds.length > 0) {
//             // Mark specific messages as seen
//             await prisma.message.updateMany({
//               where: {
//                 id: { in: messageIds },
//                 conversationId,
//                 senderId: { not: userId },
//               },
//               data: {
//                 isSeen: true,
//                 seenAt: new Date(),
//               },
//             });
//           } else {
//             // Mark all messages in conversation as seen
//             await ChatService.markMessagesAsSeen(conversationId, userId);
//           }

//           // Get updated conversations for user
//           const conversations = await ChatService.getConversationsWithUnseenCount(userId);
//           socket.emit("conversationsUpdate", conversations);
          
//           // Get updated total unseen count
//           const totalUnseen = conversations.reduce((sum, conv) => sum + (conv.unseenCount || 0), 0);
//           socket.emit("totalUnseenCount", totalUnseen);

//           // Notify senders that their messages have been seen
//           const seenMessages = await prisma.message.findMany({
//             where: {
//               conversationId,
//               senderId: { not: userId },
//               isSeen: true,
//               seenAt: { not: null },
//             },
//             select: {
//               id: true,
//               senderId: true,
//             },
//           });

//           const senderIds = [...new Set(seenMessages.map((msg:any) => msg.senderId))];
          
//           senderIds.forEach(senderId => {
//             this.io.to(`user_${senderId}`).emit("messagesSeen", {
//               conversationId,
//               messageIds: seenMessages
//                 .filter((msg:any) => msg.senderId === senderId)
//                 .map((msg:any) => msg.id),
//               seenBy: userId,
//               seenAt: new Date().toISOString(),
//             });
//           });
//         } catch (error) {
//           console.error("Error marking messages as seen:", error);
//         }
//       });

//       // Request unseen counts
//       socket.on("requestUnseenCounts", async (userId: string) => {
//         try {
//           const conversations = await ChatService.getConversationsWithUnseenCount(userId);
//           socket.emit("conversationsUpdate", conversations);
          
//           const totalUnseen = conversations.reduce((sum, conv) => sum + (conv.unseenCount || 0), 0);
//           socket.emit("totalUnseenCount", totalUnseen);
//         } catch (error) {
//           console.error("Error getting unseen counts:", error);
//         }
//       });

//       // Disconnect handler
//       socket.on("disconnect", (reason) => {
//         if (currentUserId) {
//           // Remove user from online users
//           this.onlineUsers.delete(currentUserId);

//           // Notify all other users that this user is offline
//           socket.broadcast.emit("userOffline", currentUserId);
//         }
//       });

//       // User disconnecting intentionally
//       socket.on("userDisconnecting", (userId: string) => {
//         if (userId) {
//           this.onlineUsers.delete(userId);
//           socket.broadcast.emit("userOffline", userId);
//         }
//       });

//       // Error handling
//       socket.on("error", (error) => {
//         console.error("Socket error:", error);
//       });
//     });
//   }

//   // Helper to find socket by user ID
//   private static findSocketByUserId(userId: string): any {
//     const user = this.onlineUsers.get(userId);
//     if (!user) return null;
    
//     const socket = this.io.sockets.sockets.get(user.socketId);
//     return socket || null;
//   }

//   static getIO() {
//     if (!this.io) {
//       throw new Error("Socket.IO not initialized. Call init() first.");
//     }
//     return this.io;
//   }

//   static getOnlineUsers(): string[] {
//     return Array.from(this.onlineUsers.keys());
//   }

//   static isUserOnline(userId: string): boolean {
//     return this.onlineUsers.has(userId);
//   }

//   static getUserSocketId(userId: string): string | null {
//     const user = this.onlineUsers.get(userId);
//     return user ? user.socketId : null;
//   }
// }

// export const initSocket = SocketServer.init.bind(SocketServer);
// export const getIO = SocketServer.getIO.bind(SocketServer);
// export const isUserOnline = SocketServer.isUserOnline.bind(SocketServer);