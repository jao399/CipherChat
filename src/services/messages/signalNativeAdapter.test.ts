import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { assertCanPrepareOutboundFanout, getMessageCryptoReadiness } from '../../security/messageCryptoPolicy';
import { signalX3dhPrekeyBundleFormat } from '../../security/signalPrekeyBundle';
import {
  clearRegisteredSignalOneToOneCryptoAdapter,
  isSignalNativeAdapterProductionEvidenceComplete,
  prototypeMessageEncryptionProvider,
  requiredSignalNativeAdapterEvidence,
  selectMessageEncryptionProvider,
  signalNativeAdapterContractVersion,
  type SignalNativeAdapterReadinessReport,
} from './messageEncryptionProvider';

const partialNativeAdapterReport: SignalNativeAdapterReadinessReport = {
  adapterId: 'official-libsignal-react-native-spike',
  androidPackage: 'org.signal:libsignal-client',
  doubleRatchetVectorsPassing: false,
  encryptedSessionStorageVerified: false,
  evidenceStatus: 'partial',
  externalCryptoReviewComplete: false,
  iosPod: 'LibSignalClient',
  limitations: ['Feasibility contract only; no native bridge is installed.'],
  noPrivateKeyExportToJavaScript: false,
  noSensitiveLoggingVerified: false,
  officialLibsignalVersion: '0.93.1',
  platforms: ['android', 'ios'],
  productionReady: false,
  reviewedImplementation: false,
  x3dhVectorsPassing: false,
};

describe('Signal native adapter feasibility boundary', () => {
  beforeEach(() => {
    clearRegisteredSignalOneToOneCryptoAdapter();
  });

  it('keeps production crypto blocked when no native Signal adapter is registered', () => {
    const readiness = getMessageCryptoReadiness('live');

    assert.equal(readiness.provider, 'signal-x3dh-double-ratchet-v1');
    assert.equal(readiness.productionReady, false);
    assert.equal(readiness.signalAdapterInstalled, false);
    assert.throws(() => assertCanPrepareOutboundFanout('live', readiness), /production-ready message crypto/);
  });

  it('does not treat the TypeScript native adapter contract as production readiness', () => {
    assert.equal(signalNativeAdapterContractVersion, 'signal-native-adapter-contract-v1');
    assert(requiredSignalNativeAdapterEvidence.includes('External cryptography review sign-off'));
    assert.equal(
      isSignalNativeAdapterProductionEvidenceComplete(
        partialNativeAdapterReport,
        signalX3dhPrekeyBundleFormat,
      ),
      false,
    );
    assert.equal(selectMessageEncryptionProvider('live').productionReady, false);
  });

  it('keeps the prototype provider demo-only', () => {
    assert.equal(prototypeMessageEncryptionProvider.id, 'prototype-sha256-envelope-v1');
    assert.equal(prototypeMessageEncryptionProvider.mockReady, true);
    assert.equal(prototypeMessageEncryptionProvider.productionReady, false);
  });

  it('requires complete reviewed evidence before a native adapter report can be considered complete', () => {
    const completeReport: SignalNativeAdapterReadinessReport = {
      ...partialNativeAdapterReport,
      doubleRatchetVectorsPassing: true,
      encryptedSessionStorageVerified: true,
      evidenceStatus: 'complete',
      externalCryptoReviewComplete: true,
      noPrivateKeyExportToJavaScript: true,
      noSensitiveLoggingVerified: true,
      productionReady: true,
      reviewedImplementation: true,
      x3dhVectorsPassing: true,
    };

    assert.equal(
      isSignalNativeAdapterProductionEvidenceComplete(completeReport, signalX3dhPrekeyBundleFormat),
      true,
    );
  });
});
