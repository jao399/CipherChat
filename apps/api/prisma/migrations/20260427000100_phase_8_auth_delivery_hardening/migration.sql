-- CreateTable
CREATE TABLE "DeviceSessionChallenge" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "DeviceSessionChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSessionChallenge_challenge_key" ON "DeviceSessionChallenge"("challenge");

-- CreateIndex
CREATE INDEX "DeviceSessionChallenge_accountId_deviceId_consumedAt_idx" ON "DeviceSessionChallenge"("accountId", "deviceId", "consumedAt");

-- CreateIndex
CREATE INDEX "DeviceSessionChallenge_expiresAt_idx" ON "DeviceSessionChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "EncryptedMessageEnvelope_queuedAt_id_idx" ON "EncryptedMessageEnvelope"("queuedAt", "id");

-- AddForeignKey
ALTER TABLE "DeviceSessionChallenge" ADD CONSTRAINT "DeviceSessionChallenge_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceSessionChallenge" ADD CONSTRAINT "DeviceSessionChallenge_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
