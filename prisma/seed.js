const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    // Admin user
    const hashedAdminPassword = await bcrypt.hash("test123", 10);
    await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
            hashedPassword: hashedAdminPassword,
        },
    });

    // Client user
    const hashedClientPassword = await bcrypt.hash("client123", 10);
    await prisma.user.upsert({
        where: { email: "client@example.com" },
        update: {},
        create: {
            email: "client@example.com",
            name: "Client User",
            role: "client",
            hashedPassword: hashedClientPassword,
        },
    });

    console.log("✅ Seeded both admin and client users");
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());