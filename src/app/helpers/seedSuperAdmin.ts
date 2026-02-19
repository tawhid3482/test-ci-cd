import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const seedSuperAdmin = async (prisma: PrismaClient) => {
  try {
    const seedEmail = process.env.SUPER_ADMIN_EMAIL;
    const seedPassword = process.env.SUPER_ADMIN_PASSWORD;
    const seedPhone = process.env.SUPER_ADMIN_PHONE;
    const seedName = process.env.SUPER_ADMIN_NAME || "Super Admin";

    if (!seedEmail || !seedPassword || !seedPhone) {
      console.log("Skipping super admin seed: env vars are not fully configured.");
      return;
    }

    const existingAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(seedPassword, 12);

      await prisma.user.create({
        data: {
          name: seedName,
          email: seedEmail,
          phone: seedPhone,
          password: hashedPassword,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
        },
      });
    } else {
      console.log("Super Admin already exists");
    }
  } catch (err) {
    console.error("Seed SuperAdmin error:", err);
  }
};
