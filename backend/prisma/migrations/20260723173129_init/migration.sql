-- CreateEnum
CREATE TYPE "Language" AS ENUM ('CZ', 'UA', 'EN');

-- CreateEnum
CREATE TYPE "InsuranceProvider" AS ENUM ('VZP', 'OZP', 'CPZP', 'RBP', 'VOZP', 'ZPS', 'ZPMV', 'NONE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'NEEDS_CALL', 'CANCELLED', 'NO_SHOW', 'DONE');

-- CreateEnum
CREATE TYPE "SourceChannel" AS ENUM ('TELEGRAM', 'WEB', 'WHATSAPP', 'PHONE', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('CLOSED', 'OPEN_OVERRIDE');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('ACTIVE', 'OFFERED', 'BOOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('DOCTOR', 'ASSISTANT');

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "telegramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "telegramId" TEXT,
    "email" TEXT,
    "language" "Language" NOT NULL DEFAULT 'CZ',
    "insuranceProvider" "InsuranceProvider" NOT NULL DEFAULT 'NONE',
    "consentDataProcessing" BOOLEAN NOT NULL DEFAULT false,
    "consentDataAt" TIMESTAMP(3),
    "consentHealthData" BOOLEAN NOT NULL DEFAULT false,
    "consentHealthDataAt" TIMESTAMP(3),
    "notes" TEXT,
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "colorTag" TEXT NOT NULL,
    "isAcute" BOOLEAN NOT NULL DEFAULT false,
    "requiresInsurance" "InsuranceProvider",
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VisitType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotTemplate" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "timeStart" TEXT NOT NULL,
    "timeEnd" TEXT NOT NULL,
    "slotLengthMinutes" INTEGER NOT NULL,
    "capacityPerSlot" INTEGER NOT NULL DEFAULT 1,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotTemplateVisitType" (
    "slotTemplateId" TEXT NOT NULL,
    "visitTypeId" TEXT NOT NULL,

    CONSTRAINT "SlotTemplateVisitType_pkey" PRIMARY KEY ("slotTemplateId","visitTypeId")
);

-- CreateTable
CREATE TABLE "SlotException" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeStart" TEXT NOT NULL,
    "timeEnd" TEXT NOT NULL,
    "type" "ExceptionType" NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitTypeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeStart" TEXT NOT NULL,
    "timeEnd" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "isAcute" BOOLEAN NOT NULL DEFAULT false,
    "sourceChannel" "SourceChannel" NOT NULL,
    "triageAnswers" JSONB,
    "photoRefs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "reminder24hSentAt" TIMESTAMP(3),
    "reminder2hSentAt" TIMESTAMP(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitTypeId" TEXT NOT NULL,
    "desiredDateFrom" TIMESTAMP(3) NOT NULL,
    "desiredDateUntil" TIMESTAMP(3) NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationLog" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "channel" "SourceChannel" NOT NULL,
    "rawMessages" JSONB NOT NULL,
    "resolvedAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_telegramId_key" ON "Staff"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_phone_key" ON "Patient"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_telegramId_key" ON "Patient"("telegramId");

-- CreateIndex
CREATE INDEX "SlotException_date_idx" ON "SlotException"("date");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- AddForeignKey
ALTER TABLE "SlotTemplateVisitType" ADD CONSTRAINT "SlotTemplateVisitType_slotTemplateId_fkey" FOREIGN KEY ("slotTemplateId") REFERENCES "SlotTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotTemplateVisitType" ADD CONSTRAINT "SlotTemplateVisitType_visitTypeId_fkey" FOREIGN KEY ("visitTypeId") REFERENCES "VisitType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_visitTypeId_fkey" FOREIGN KEY ("visitTypeId") REFERENCES "VisitType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_visitTypeId_fkey" FOREIGN KEY ("visitTypeId") REFERENCES "VisitType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationLog" ADD CONSTRAINT "ConversationLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
