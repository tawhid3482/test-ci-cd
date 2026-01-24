import "dotenv/config";
import http from "http";
import app from "./app";
import { PrismaClient } from "@prisma/client";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/helpers/seedSuperAdmin";

const prisma = new PrismaClient();

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected to MongoDB");
    await seedSuperAdmin(prisma);

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
