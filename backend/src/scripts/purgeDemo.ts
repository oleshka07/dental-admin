/**
 * Deletes the demo dataset and nothing else.
 *
 * Run with: npm run demo:purge          (source checkout)
 *           node dist/scripts/purgeDemo.js   (on the server)
 *
 * Two flags identify demo data:
 *   - `Patient.isDemo` — the generated patients, and everything hanging off them
 *   - `Appointment.isDemo` — also covers the showcase history attached to a
 *     REAL patient (the one who owns DEMO_TELEGRAM_ID), whose own record must
 *     survive this purge even though those visits must not
 */
import { prisma } from '../db';

export async function purgeDemo(): Promise<{
  patients: number;
  appointments: number;
  waitlistEntries: number;
  conversationLogs: number;
}> {
  const demoPatients = await prisma.patient.findMany({
    where: { isDemo: true },
    select: { id: true },
  });
  const ids = demoPatients.map((p) => p.id);

  // Demo appointments are deleted even when no demo patients exist, because
  // they may be attached to a real one.
  const appointments = await prisma.appointment.deleteMany({
    where: { OR: [{ isDemo: true }, { patientId: { in: ids } }] },
  });

  if (ids.length === 0) {
    return { patients: 0, appointments: appointments.count, waitlistEntries: 0, conversationLogs: 0 };
  }

  // Remaining children first — the foreign keys are restrict-by-default, so
  // deleting a patient with rows still attached would fail.
  const waitlistEntries = await prisma.waitlistEntry.deleteMany({ where: { patientId: { in: ids } } });
  const conversationLogs = await prisma.conversationLog.deleteMany({ where: { patientId: { in: ids } } });
  const patients = await prisma.patient.deleteMany({ where: { isDemo: true } });

  return {
    patients: patients.count,
    appointments: appointments.count,
    waitlistEntries: waitlistEntries.count,
    conversationLogs: conversationLogs.count,
  };
}

if (require.main === module) {
  purgeDemo()
    .then((counts) => {
      console.log('Demo data removed:', counts);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
