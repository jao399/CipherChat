import { findPushNotificationPolicyViolations } from './pushNotificationPolicy';

export type PushProviderEvidence = {
  apnsConfigured: boolean;
  fcmConfigured: boolean;
  genericPayloadPolicyEnforced: boolean;
  providerLogReviewAttached: boolean;
  releaseSmokeEvidenceAttached: boolean;
};

export type PushProviderReadinessReport = {
  productionReady: boolean;
  apnsConfigured: boolean;
  fcmConfigured: boolean;
  blockers: string[];
  summary: string;
};

const genericProbePayload = {
  deliveryHint: 'sync_required',
  opaqueEventId: 'evt_push_readiness_probe',
};

const sensitivePayloadProbes = [
  { body: 'plaintext body', deliveryHint: 'sync_required', opaqueEventId: 'evt_probe' },
  { deliveryHint: 'sync_required', opaqueEventId: 'evt_probe', senderName: 'Alice' },
  { deliveryHint: 'sync_required', fileName: 'secret.pdf', opaqueEventId: 'evt_probe' },
  { conversationId: 'conversation_1', deliveryHint: 'sync_required', opaqueEventId: 'evt_probe' },
  { accountId: 'account_1', deliveryHint: 'sync_required', opaqueEventId: 'evt_probe' },
  { contactId: 'contact_1', deliveryHint: 'sync_required', opaqueEventId: 'evt_probe' },
  { deliveryHint: 'sync_required', opaqueEventId: 'evt_probe', pushToken: 'push-token' },
  { deliveryHint: 'sync_required', opaqueEventId: 'evt_probe', safetyNumber: '0000 1111' },
];

export const missingProductionPushProviderEvidence: PushProviderEvidence = {
  apnsConfigured: false,
  fcmConfigured: false,
  genericPayloadPolicyEnforced: true,
  providerLogReviewAttached: false,
  releaseSmokeEvidenceAttached: false,
};

function genericPayloadPolicyBlocksSensitiveData() {
  const genericPayloadAccepted = findPushNotificationPolicyViolations(genericProbePayload).length === 0;
  const sensitivePayloadsBlocked = sensitivePayloadProbes.every(
    (payload) => findPushNotificationPolicyViolations(payload).length > 0,
  );

  return genericPayloadAccepted && sensitivePayloadsBlocked;
}

export function evaluatePushProviderReadiness(
  evidence: PushProviderEvidence = missingProductionPushProviderEvidence,
): PushProviderReadinessReport {
  const blockers: string[] = [];
  const policyBlocksSensitiveData = genericPayloadPolicyBlocksSensitiveData();

  if (!evidence.apnsConfigured) {
    blockers.push('APNs provider is not configured.');
  }

  if (!evidence.fcmConfigured) {
    blockers.push('FCM provider is not configured.');
  }

  if (!evidence.genericPayloadPolicyEnforced || !policyBlocksSensitiveData) {
    blockers.push('Generic push payload policy enforcement evidence is missing.');
  }

  if (!evidence.providerLogReviewAttached) {
    blockers.push('Provider log review evidence is missing.');
  }

  if (!evidence.releaseSmokeEvidenceAttached) {
    blockers.push('APNs/FCM release smoke evidence is missing.');
  }

  const productionReady = blockers.length === 0;

  return {
    apnsConfigured: evidence.apnsConfigured,
    blockers,
    fcmConfigured: evidence.fcmConfigured,
    productionReady,
    summary: productionReady
      ? 'APNs/FCM providers have generic payload and release evidence.'
      : `Production push providers remain blocked: ${blockers.join(' ')}`,
  };
}

