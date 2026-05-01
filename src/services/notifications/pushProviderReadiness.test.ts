import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  evaluatePushProviderReadiness,
  missingProductionPushProviderEvidence,
} from './pushProviderReadiness';

describe('push provider production readiness', () => {
  it('blocks production readiness by default when APNs/FCM evidence is missing', () => {
    const report = evaluatePushProviderReadiness();

    assert.equal(report.productionReady, false);
    assert.equal(report.apnsConfigured, false);
    assert.equal(report.fcmConfigured, false);
    assert(report.blockers.some((blocker) => blocker.includes('APNs provider is not configured')));
    assert(report.blockers.some((blocker) => blocker.includes('FCM provider is not configured')));
    assert(report.blockers.some((blocker) => blocker.includes('Provider log review evidence is missing')));
  });

  it('does not treat generic policy alone as provider evidence', () => {
    const report = evaluatePushProviderReadiness({
      ...missingProductionPushProviderEvidence,
      genericPayloadPolicyEnforced: true,
    });

    assert.equal(report.productionReady, false);
    assert(report.blockers.some((blocker) => blocker.includes('APNs provider is not configured')));
    assert(report.blockers.some((blocker) => blocker.includes('FCM provider is not configured')));
  });

  it('accepts only configured providers with generic payload and release evidence', () => {
    const report = evaluatePushProviderReadiness({
      apnsConfigured: true,
      fcmConfigured: true,
      genericPayloadPolicyEnforced: true,
      providerLogReviewAttached: true,
      releaseSmokeEvidenceAttached: true,
    });

    assert.equal(report.productionReady, true);
    assert.deepEqual(report.blockers, []);
  });

  it('blocks readiness if generic payload enforcement evidence is missing', () => {
    const report = evaluatePushProviderReadiness({
      apnsConfigured: true,
      fcmConfigured: true,
      genericPayloadPolicyEnforced: false,
      providerLogReviewAttached: true,
      releaseSmokeEvidenceAttached: true,
    });

    assert.equal(report.productionReady, false);
    assert(report.blockers.some((blocker) => blocker.includes('Generic push payload policy')));
  });
});

