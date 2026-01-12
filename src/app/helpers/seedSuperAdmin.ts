import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const seedSuperAdmin = async (prisma: PrismaClient) => {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("654321", 10);
      await prisma.user.create({
        data: {
          name: "Tawhidul Islam",
          email: "tawhidulislam3482@gmail.com",
          phone: "01826853371",
          password: hashedPassword,
          role: "SUPER_ADMIN",
          gender: "Male",
          status: "Active",
        },
      });
    } else {
      console.log("Super Admin already exists");
    }
  } catch (err) {
    console.error("Seed SuperAdmin error:", err);
  }
};
