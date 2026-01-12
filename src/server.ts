import "dotenv/config";
import http from "http";
import app from "./app";
import { PrismaClient } from "@prisma/client";
import { envVars } from "../src/app/config/env";

// কোনো আর্গুমেন্ট ছাড়া কল করুন, Prisma অটোমেটিক prisma.config.ts থেকে ডাটা নেবে
const prisma = new PrismaClient();

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected to MongoDB");

    const server = http.createServer(app);
    const PORT = envVars.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    process.exit(1);
  }
}

startServer();