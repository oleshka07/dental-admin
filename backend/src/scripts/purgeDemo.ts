/**
 * Deletes the demo dataset and nothing else.
 *
 * Run with: npm run demo:purge          (source checkout)
 *           node dist/scripts/purgeDemo.js   (on the server)
 *
 * The only thing that identifies demo data is `Patient.isDemo`. Every other
 * demo row is reachable from a demo patient, so deleting children-then-parents
 * for exactly that set is complete and cannot touch a real record.
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

  if (ids.length === 0) {
    return { patients: 0, appointments: 0, waitlistEntries: 0, conversationLogs: 0 };
  }

  // Children first — the foreign keys are restrict-by-default, so deleting a
  // patient with appointments still attached would fail.
  const appointments = await prisma.appointment.deleteMany({ where: { patientId: { in: ids } } });
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
