-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DeviceTrustState" AS ENUM ('UNVERIFIED', 'VERIFIED', 'CHANGED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EnvelopeDeliveryState" AS ENUM ('QUEUED', 'DELIVERED', 'ACKNOWLEDGED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "trustState" "DeviceTrustState" NOT NULL DEFAULT 'UNVERIFIED',
    "lastSeenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrekeyBundle" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "signedPrekey" TEXT NOT NULL,
    "signedPrekeySignature" TEXT NOT NULL,
    "oneTimePrekeys" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrekeyBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncryptedMessageEnvelope" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderAccountId" TEXT NOT NULL,
    "senderDeviceId" TEXT NOT NULL,
    "recipientAccountId" TEXT NOT NULL,
    "recipientDeviceId" TEXT NOT NULL,
    "headerCiphertext" TEXT NOT NULL,
    "bodyCiphertext" TEXT NOT NULL,
    "deliveryState" "EnvelopeDeliveryState" NOT NULL DEFAULT 'QUEUED',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "EncryptedMessageEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncryptedFileObject" (
    "id" TEXT NOT NULL,
    "ownerAccountId" TEXT NOT NULL,
    "objectRef" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "contentDigest" TEXT NOT NULL,
    "encryptedName" TEXT,
    "encryptedMimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EncryptedFileObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbuseReport" (
    "id" TEXT NOT NULL,
    "reporterAccountId" TEXT NOT NULL,
    "reportedAccountId" TEXT,
    "selectedDisclosure" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbuseReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");

-- CreateIndex
CREATE INDEX "Device_accountId_idx" ON "Device"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "PrekeyBundle_deviceId_key" ON "PrekeyBundle"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "EncryptedMessageEnvelope_messageId_key" ON "EncryptedMessageEnvelope"("messageId");

-- CreateIndex
CREATE INDEX "EncryptedMessageEnvelope_recipientAccountId_recipientDevice_idx" ON "EncryptedMessageEnvelope"("recipientAccountId", "recipientDeviceId", "deliveryState");

-- CreateIndex
CREATE INDEX "EncryptedMessageEnvelope_conversationId_idx" ON "EncryptedMessageEnvelope"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "EncryptedFileObject_objectRef_key" ON "EncryptedFileObject"("objectRef");

-- CreateIndex
CREATE INDEX "EncryptedFileObject_ownerAccountId_idx" ON "EncryptedFileObject"("ownerAccountId");

-- CreateIndex
CREATE INDEX "AuditEvent_accountId_eventType_idx" ON "AuditEvent"("accountId", "eventType");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrekeyBundle" ADD CONSTRAINT "PrekeyBundle_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbuseReport" ADD CONSTRAINT "AbuseReport_reporterAccountId_fkey" FOREIGN KEY ("reporterAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

