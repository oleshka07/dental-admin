import { Prisma, SourceChannel } from '@prisma/client';
import { prisma } from '../db';
import { getAvailability } from './availability';
import { toDateOnly } from '../utils/time';

export class SlotUnavailableError extends Error {
  constructor() {
    super('Requested slot is no longer available');
    this.name = 'SlotUnavailableError';
  }
}

export async function createAppointment(params: {
  patientId: string;
  visitTypeId: string;
  date: Date;
  timeStart: string;
  timeEnd: string;
  sourceChannel: SourceChannel;
  isAcute?: boolean;
  triageAnswers?: Prisma.InputJsonValue;
}) {
  const { patientId, visitTypeId, date, timeStart, timeEnd, sourceChannel, isAcute, triageAnswers } = params;
  const day = toDateOnly(date);

  return prisma.$transaction(
    async (tx) => {
      // Re-check availability inside the transaction to avoid double-booking races.
      const slots = await getAvailability({ from: day, to: day, visitTypeId });
      const match = slots.find((s) => s.timeStart === timeStart && s.timeEnd === timeEnd);
      if (!match || match.remainingCapacity <= 0) {
        throw new SlotUnavailableError();
      }

      return tx.appointment.create({
        data: {
          patientId,
          visitTypeId,
          date: day,
          timeStart,
          timeEnd,
          status: 'PENDING_CONFIRMATION',
          isAcute: isAcute ?? false,
          sourceChannel,
          triageAnswers,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
