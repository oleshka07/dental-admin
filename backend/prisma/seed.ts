import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const acute = await prisma.visitType.create({
    data: { name: 'Akutní bolest', durationMinutes: 20, colorTag: '#e53935', isAcute: true },
  });
  const checkup = await prisma.visitType.create({
    data: { name: 'Preventivní prohlídka', durationMinutes: 20, colorTag: '#43a047', isAcute: false },
  });
  const procedure = await prisma.visitType.create({
    data: { name: 'Zákrok (plomba, extrakce, ...)', durationMinutes: 45, colorTag: '#1e88e5', isAcute: false },
  });

  // Thursday 07:00-09:00 — acute pain only.
  await prisma.slotTemplate.create({
    data: {
      weekday: 4,
      timeStart: '07:00',
      timeEnd: '09:00',
      slotLengthMinutes: 20,
      capacityPerSlot: 1,
      visitTypes: { create: [{ visitTypeId: acute.id }] },
    },
  });

  // Friday 08:00-10:00 — procedures.
  await prisma.slotTemplate.create({
    data: {
      weekday: 5,
      timeStart: '08:00',
      timeEnd: '10:00',
      slotLengthMinutes: 30,
      capacityPerSlot: 1,
      visitTypes: { create: [{ visitTypeId: procedure.id }] },
    },
  });

  // Tuesday, Wednesday, Thursday 16:00-17:00 — checkups.
  for (const weekday of [2, 3, 4]) {
    await prisma.slotTemplate.create({
      data: {
        weekday,
        timeStart: '16:00',
        timeEnd: '17:00',
        slotLengthMinutes: 20,
        capacityPerSlot: 1,
        visitTypes: { create: [{ visitTypeId: checkup.id }] },
      },
    });
  }

  console.log('Seed complete:', { acute: acute.id, checkup: checkup.id, procedure: procedure.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
