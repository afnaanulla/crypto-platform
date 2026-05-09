import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const seed = async (): Promise<void> => {
  console.log("🌱 Seeding demo user...");

  const email = "demo@kuvaka.io";
  const password = "demo123";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("✅ Demo user already exists — skipping");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });

  console.log(`✅ Demo user created: ${user.email} (id: ${user.id})`);
  console.log("   Email:    demo@kuvaka.io");
  console.log("   Password: demo123");
};

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
