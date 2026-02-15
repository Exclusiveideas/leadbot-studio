import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillOrganizations() {
  console.log("Starting organization backfill...");

  const usersWithoutOrg = await prisma.user.findMany({
    where: { organizationId: null, organizationRole: null },
  });

  console.log(`Found ${usersWithoutOrg.length} users without an organization.`);

  let succeeded = 0;
  let failed = 0;

  for (const user of usersWithoutOrg) {
    const orgName = user.name
      ? `${user.name}'s Workspace`
      : `${user.email}'s Workspace`;

    try {
      await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: orgName,
            createdBy: user.id,
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            organizationId: org.id,
            organizationRole: "OWNER",
          },
        });

        await tx.chatbot.updateMany({
          where: {
            createdBy: user.id,
            organizationId: null,
          },
          data: {
            organizationId: org.id,
          },
        });
      });

      succeeded++;
      console.log(`Created org "${orgName}" for user ${user.email}`);
    } catch (error) {
      failed++;
      console.error(`Failed to backfill user ${user.email}:`, error);
    }
  }

  console.log(
    `Backfill complete. Succeeded: ${succeeded}, Failed: ${failed}`,
  );
}

backfillOrganizations()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
