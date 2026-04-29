import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import {
  API_BASE_URL_STORAGE_KEY,
  API_MODE_STORAGE_KEY,
  DEFAULT_API_BASE_URL,
  DEFAULT_BACKEND_MODE,
  type BackendMode,
} from '../../config/api';
import {
  applyRemoteBundleToTrustRecord,
  getIdentityTrustStatus,
  markRemoteTrustRecordTrusted,
  markIdentityTrusted,
  prototypeDeviceIdentityProvider,
  readRemoteTrustRecords,
  assertCanPrepareOutboundFanout,
  assertCanProcessInboundEnvelopes,
  assertRecipientTrustedForSend,
  canSendWithMessageCrypto,
  getMessageCryptoReadiness,
  upsertRemoteTrustRecordFromBundle,
  type IdentityTrustStatus,
  type LocalDeviceIdentity,
} from '../../security';
import { remoteIdentityTrust } from '../../data/mockData';
import { CipherChatApiClient } from './cipherChatApiClient';
import { getStoredApiSession, setStoredApiSession, clearStoredApiSession, type StoredApiSession } from './apiSessionStore';
import { mockCipherChatApiClient } from './mockCipherChatApiClient';
import type {
  AccountDiscoveryResult,
  AccountDevice,
  BackendStatus,
  DevicePrekeyStatus,
  InboundEnvelopeSyncStatus,
  PublicDeviceBundleResponse,
} from './types';
import {
  readOutboundQueue,
  replaceOutboundQueueItem,
  updateOutboundQueueItem,
  type OutboundQueueItem,
} from '../messages/outboundQueueStore';
import {
  emptyInboundEnvelopeSyncState,
  mergeInboundDeliveryReceipts,
  readInboundEnvelopeSyncState,
  type InboundEnvelopeSyncState,
} from '../messages/inboundEnvelopeStore';
import { selectMessageEncryptionProvider } from '../messages/messageEncryptionProvider';
import type { RemoteIdentityTrustRecord } from '../../types';

type BackendContextValue = {
  status: BackendStatus;
  session: StoredApiSession | null;
  initializing: boolean;
  setMode(mode: BackendMode): Promise<void>;
  setBaseUrl(baseUrl: string): Promise<void>;
  refreshStatus(): Promise<void>;
  bootstrapPrototypeSession(): Promise<StoredApiSession>;
  trustCurrentDeviceIdentity(): Promise<void>;
  rotateDeviceIdentity(): Promise<void>;
  remoteTrustRecords: RemoteIdentityTrustRecord[];
  contactDiscoveryResults: AccountDiscoveryResult[];
  accountDevices: AccountDevice[];
  devicePrekeyStatus: DevicePrekeyStatus | null;
  discoverContacts(query: string): Promise<AccountDiscoveryResult[]>;
  refreshAccountDevices(): Promise<AccountDevice[]>;
  refreshDevicePrekeyStatus(): Promise<DevicePrekeyStatus>;
  addDiscoveredContact(accountId: string, deviceId: string): Promise<void>;
  sendSecureMessage(input: {
    conversationId: string;
    recipientRecordId: string;
    plaintext: string;
    disappearingTimer: string;
  }): Promise<OutboundQueueItem>;
  outboundQueue: OutboundQueueItem[];
  retryOutboundMessage(itemId: string): Promise<OutboundQueueItem>;
  inboundEnvelopeStatus: InboundEnvelopeSyncStatus;
  pollInboundEnvelopes(): Promise<InboundEnvelopeSyncStatus>;
  syncRemoteIdentity(recordId: string): Promise<void>;
  trustRemoteIdentity(recordId: string): Promise<void>;
  revokeAccountDevice(deviceId: string): Promise<void>;
  revokeCurrentDevice(): Promise<void>;
  clearSession(): Promise<void>;
};

export const BackendContext = createContext<BackendContextValue | null>(null);

function summarizeReadiness(mode: BackendMode, ready: boolean, checks?: BackendStatus['summary']) {
  if (mode === 'mock') {
    return 'Mock mode active. UI demo data stays local.';
  }

  return ready ? 'Live API connected.' : checks ?? 'Live API unavailable.';
}

function createInboundStatus(
  state: InboundEnvelopeSyncState,
  overrides: Partial<InboundEnvelopeSyncStatus> = {},
): InboundEnvelopeSyncStatus {
  return {
    polling: false,
    pendingCount: 0,
    acknowledgedCount: 0,
    totalFetched: state.totalFetched,
    totalAcknowledged: state.totalAcknowledged,
    receiptCount: state.receipts.length,
    pageCount: 0,
    nextCursor: state.nextCursor,
    lastPolledAt: state.lastPolledAt,
    lastAcknowledgedAt: state.lastAcknowledgedAt,
    ...overrides,
  };
}

export function BackendProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<BackendMode>(DEFAULT_BACKEND_MODE);
  const [baseUrl, setBaseUrlState] = useState(DEFAULT_API_BASE_URL);
  const [ready, setReady] = useState(false);
  const [summary, setSummary] = useState('Backend status not checked yet.');
  const [session, setSession] = useState<StoredApiSession | null>(null);
  const [identity, setIdentity] = useState<LocalDeviceIdentity | null>(null);
  const [trustStatus, setTrustStatus] = useState<IdentityTrustStatus | null>(null);
  const [remoteTrustRecords, setRemoteTrustRecords] = useState<RemoteIdentityTrustRecord[]>(remoteIdentityTrust);
  const [contactDiscoveryResults, setContactDiscoveryResults] = useState<AccountDiscoveryResult[]>([]);
  const [accountDevices, setAccountDevices] = useState<AccountDevice[]>([]);
  const [devicePrekeyStatus, setDevicePrekeyStatus] = useState<DevicePrekeyStatus | null>(null);
  const [outboundQueue, setOutboundQueue] = useState<OutboundQueueItem[]>([]);
  const [inboundSyncState, setInboundSyncState] = useState<InboundEnvelopeSyncState>(emptyInboundEnvelopeSyncState);
  const [inboundEnvelopeStatus, setInboundEnvelopeStatus] = useState<InboundEnvelopeSyncStatus>(
    createInboundStatus(emptyInboundEnvelopeSyncState),
  );
  const [syncingRemoteTrust, setSyncingRemoteTrust] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const liveClient = useMemo(() => new CipherChatApiClient(baseUrl), [baseUrl]);
  const messageEncryptionProvider = useMemo(() => selectMessageEncryptionProvider(mode), [mode]);
  const messageCryptoReadiness = useMemo(
    () => getMessageCryptoReadiness(mode, messageEncryptionProvider),
    [messageEncryptionProvider, mode],
  );

  const refreshStatus = useCallback(async () => {
    if (mode === 'mock') {
      const readiness = await mockCipherChatApiClient.readiness();
      setReady(readiness.ok);
      setSummary(summarizeReadiness('mock', readiness.ok));
      return;
    }

    try {
      const readiness = await liveClient.readiness();
      setReady(readiness.ok);
      setSummary(`${summarizeReadiness('live', readiness.ok)} DB: ${readiness.checks.database}. Queue: ${readiness.checks.queue}.`);
    } catch (error) {
      setReady(false);
      setSummary(error instanceof Error ? error.message : 'Live API unavailable.');
    }
  }, [liveClient, mode]);

  useEffect(() => {
    let active = true;

    async function load() {
      const [
        storedMode,
        storedBaseUrl,
        storedSession,
        storedIdentity,
        storedRemoteTrust,
        storedOutboundQueue,
        storedInboundSync,
      ] = await Promise.all([
          AsyncStorage.getItem(API_MODE_STORAGE_KEY),
          AsyncStorage.getItem(API_BASE_URL_STORAGE_KEY),
          getStoredApiSession(),
          prototypeDeviceIdentityProvider.getOrCreateIdentity(),
          readRemoteTrustRecords(remoteIdentityTrust),
          readOutboundQueue(),
          readInboundEnvelopeSyncState(),
        ]);
      const storedTrustStatus = await getIdentityTrustStatus(storedIdentity);

      if (!active) {
        return;
      }

      if (storedMode === 'mock' || storedMode === 'live') {
        setModeState(storedMode);
      }

      if (storedBaseUrl) {
        setBaseUrlState(storedBaseUrl);
      }

      const compatibleSession =
        storedSession &&
        storedSession.accountId === storedIdentity.accountId &&
        storedSession.deviceId === storedIdentity.deviceId
          ? storedSession
          : null;

      if (storedSession && !compatibleSession) {
        await clearStoredApiSession();
      }

      setSession(compatibleSession);
      setIdentity(storedIdentity);
      setTrustStatus(storedTrustStatus);
      setRemoteTrustRecords(storedRemoteTrust);
      setOutboundQueue(storedOutboundQueue);
      setInboundSyncState(storedInboundSync);
      setInboundEnvelopeStatus(createInboundStatus(storedInboundSync));
      setInitializing(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!initializing) {
      void refreshStatus();
    }
  }, [initializing, refreshStatus]);

  const persistMode = useCallback(
    async (nextMode: BackendMode) => {
      setModeState(nextMode);
      await AsyncStorage.setItem(API_MODE_STORAGE_KEY, nextMode);
    },
    [],
  );

  const persistBaseUrl = useCallback(async (nextBaseUrl: string) => {
    setBaseUrlState(nextBaseUrl);
    await AsyncStorage.setItem(API_BASE_URL_STORAGE_KEY, nextBaseUrl);
  }, []);

  const bootstrapPrototypeSession = useCallback(async () => {
    const deviceIdentity = await prototypeDeviceIdentityProvider.getOrCreateIdentity();
    const ids = {
      accountId: deviceIdentity.accountId,
      deviceId: deviceIdentity.deviceId,
    };
    const bundle = prototypeDeviceIdentityProvider.createDeviceBundle(deviceIdentity);
    const nextTrustStatus = await getIdentityTrustStatus(deviceIdentity);

    setIdentity(deviceIdentity);
    setTrustStatus(nextTrustStatus);

    if (mode === 'mock') {
      await mockCipherChatApiClient.publishDeviceBundle(bundle);
      const created = await mockCipherChatApiClient.createDeviceSession(ids);
      const stored = {
        accountId: created.accountId,
        deviceId: created.deviceId,
        token: created.token,
      };
      await setStoredApiSession(stored);
      setSession(stored);
      setReady(true);
      setSummary('Mock device session ready.');
      setTrustStatus(await markIdentityTrusted(deviceIdentity));
      return stored;
    }

    await liveClient.publishDeviceBundle(bundle);
    const challenge = await liveClient.createDeviceChallenge(ids);
    const signature = await prototypeDeviceIdentityProvider.signDeviceChallenge({
      identity: deviceIdentity,
      challenge: challenge.challenge,
    });
    const created = await liveClient.createDeviceSession({
      ...ids,
      challengeId: challenge.challengeId,
      signature,
    });
    const stored = {
      accountId: created.accountId,
      deviceId: created.deviceId,
      token: created.token,
    };
    await setStoredApiSession(stored);
    setSession(stored);
    setTrustStatus(await markIdentityTrusted(deviceIdentity));
    await refreshStatus();
    return stored;
  }, [liveClient, mode, refreshStatus]);

  const trustCurrentDeviceIdentity = useCallback(async () => {
    const deviceIdentity = await prototypeDeviceIdentityProvider.getOrCreateIdentity();
    setIdentity(deviceIdentity);
    setTrustStatus(await markIdentityTrusted(deviceIdentity));
  }, []);

  const rotateDeviceIdentity = useCallback(async () => {
    await clearStoredApiSession();
    const nextIdentity = await prototypeDeviceIdentityProvider.rotateIdentity();
    const nextTrustStatus = await getIdentityTrustStatus(nextIdentity);
    setSession(null);
    setIdentity(nextIdentity);
    setTrustStatus(nextTrustStatus);
    setSummary('Device identity rotated. Review the changed safety number and verify again.');
  }, []);

  const syncRemoteIdentity = useCallback(
    async (recordId: string) => {
      const record = remoteTrustRecords.find((item) => item.id === recordId);

      if (!record) {
        throw new Error('Remote identity record was not found.');
      }

      if (mode === 'live' && !session?.token) {
        throw new Error('Live remote identity sync requires a verified device session.');
      }

      setSyncingRemoteTrust(true);

      try {
        const bundle =
          mode === 'mock'
            ? await mockCipherChatApiClient.getPublicDeviceBundle({
                accountId: record.accountId,
                deviceId: record.deviceId,
              })
            : await liveClient.getPublicDeviceBundle({
                accountId: record.accountId,
                deviceId: record.deviceId,
                token: session?.token ?? '',
              });
        const nextRecords = await applyRemoteBundleToTrustRecord(remoteTrustRecords, record.id, bundle);
        setRemoteTrustRecords(nextRecords);
        setSummary(`Synced public bundle for ${record.displayName}.`);
      } finally {
        setSyncingRemoteTrust(false);
      }
    },
    [liveClient, mode, remoteTrustRecords, session?.token],
  );

  const discoverContacts = useCallback(
    async (query: string) => {
      const normalizedQuery = query.trim();

      if (normalizedQuery.length < 2) {
        setContactDiscoveryResults([]);
        return [];
      }

      if (mode === 'live' && !session?.token) {
        throw new Error('Live contact discovery requires a verified device session.');
      }

      const response =
        mode === 'mock'
          ? await mockCipherChatApiClient.discoverAccounts({ query: normalizedQuery, limit: 10 })
          : await liveClient.discoverAccounts({
              query: normalizedQuery,
              limit: 10,
              token: session?.token ?? '',
            });

      setContactDiscoveryResults(response.results);
      setSummary(
        response.results.length > 0
          ? `Found ${response.results.length} contact ${response.results.length === 1 ? 'result' : 'results'}.`
          : 'No discoverable contacts matched that query.',
      );
      return response.results;
    },
    [liveClient, mode, session?.token],
  );

  const refreshAccountDevices = useCallback(async () => {
    if (!session) {
      setAccountDevices([]);
      setDevicePrekeyStatus(null);
      throw new Error('Start a verified device session before loading account devices.');
    }

    const response =
      mode === 'mock'
        ? await mockCipherChatApiClient.listAccountDevices({
            accountId: session.accountId,
            deviceId: session.deviceId,
          })
        : await liveClient.listAccountDevices(session.token);

    setAccountDevices(response.devices);
    setSummary(
      response.devices.length > 0
        ? `Loaded ${response.devices.length} account device${response.devices.length === 1 ? '' : 's'}.`
        : 'No account devices were returned.',
    );
    return response.devices;
  }, [liveClient, mode, session]);

  const refreshDevicePrekeyStatus = useCallback(async () => {
    if (!session) {
      setDevicePrekeyStatus(null);
      throw new Error('Start a verified device session before loading prekey inventory.');
    }

    const status =
      mode === 'mock'
        ? await mockCipherChatApiClient.getDevicePrekeyStatus({
            accountId: session.accountId,
            deviceId: session.deviceId,
          })
        : await liveClient.getDevicePrekeyStatus(session.token);

    setDevicePrekeyStatus(status);
    setSummary(
      status.needsTopUp
        ? `Prekey inventory is below ${status.lowWatermark}. Top up before production messaging.`
        : `Prekey inventory healthy with ${status.oneTimePrekeyCount} one-time prekeys.`,
    );
    return status;
  }, [liveClient, mode, session]);

  const addDiscoveredContact = useCallback(
    async (accountId: string, deviceId: string) => {
      const account = contactDiscoveryResults.find((result) => result.accountId === accountId);
      const device = account?.devices.find((item) => item.deviceId === deviceId);

      if (!account || !device) {
        throw new Error('Discovery result was not found. Search again before adding this key.');
      }

      const bundle: PublicDeviceBundleResponse = {
        accountId: account.accountId,
        accountDisplayName: account.displayName,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        identityKey: device.identityKey,
        signedPrekey: device.signedPrekey,
        signedPrekeySignature: device.signedPrekeySignature,
        oneTimePrekeys: device.oneTimePrekeys,
        publishedAt: device.publishedAt,
      };
      const nextRecords = await upsertRemoteTrustRecordFromBundle(remoteTrustRecords, bundle, {
        id: account.accountId,
        handle: account.username ? `@${account.username}` : undefined,
      });

      setRemoteTrustRecords(nextRecords);
      setSummary(`${account.displayName} was added for safety number review.`);
    },
    [contactDiscoveryResults, remoteTrustRecords],
  );

  const sendSecureMessage = useCallback(
    async (input: { conversationId: string; recipientRecordId: string; plaintext: string; disappearingTimer: string }) => {
      const plaintext = input.plaintext.trim();

      if (!plaintext) {
        throw new Error('Type a message before sending.');
      }

      assertCanPrepareOutboundFanout(mode, messageCryptoReadiness);

      if (mode === 'live' && !session?.token) {
        throw new Error('Live encrypted sending requires a verified device session.');
      }

      const activeSession = session ?? (mode === 'mock' ? await bootstrapPrototypeSession() : null);

      if (!activeSession) {
        throw new Error('Start a verified device session before sending.');
      }

      const recipient = remoteTrustRecords.find((record) => record.id === input.recipientRecordId);
      assertRecipientTrustedForSend(recipient);

      const fanout = await messageEncryptionProvider.prepareOutboundFanout({
        conversationId: input.conversationId,
        senderAccountId: activeSession.accountId,
        senderDeviceId: activeSession.deviceId,
        plaintext,
        disappearingTimer: input.disappearingTimer,
        recipients: [recipient],
      });
      const now = new Date().toISOString();
      const queuedItem: OutboundQueueItem = {
        id: `outbound_${fanout.envelopes[0]?.messageId ?? Date.now()}`,
        conversationId: input.conversationId,
        recipientRecordId: recipient.id,
        recipientDisplayName: recipient.displayName,
        state: 'queued',
        attemptCount: 0,
        envelopeCount: fanout.envelopes.length,
        fanout,
        createdAt: now,
        updatedAt: now,
      };
      let nextQueue = await replaceOutboundQueueItem(outboundQueue, queuedItem);
      setOutboundQueue(nextQueue);

      const sendingItem: OutboundQueueItem = {
        ...queuedItem,
        state: 'sending',
        attemptCount: queuedItem.attemptCount + 1,
        updatedAt: new Date().toISOString(),
        lastError: undefined,
      };
      nextQueue = await replaceOutboundQueueItem(nextQueue, sendingItem);
      setOutboundQueue(nextQueue);

      try {
        const response =
          mode === 'mock'
            ? await mockCipherChatApiClient.sendEnvelopeFanout(fanout)
            : await liveClient.sendEnvelopeFanout(fanout, activeSession.token);
        const sentItem: OutboundQueueItem = {
          ...sendingItem,
          state: response.accepted ? 'sent' : 'failed',
          envelopeCount: response.envelopeCount,
          sentAt: response.accepted ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
          lastError: response.accepted ? undefined : 'Encrypted message fanout was not accepted.',
        };
        nextQueue = await replaceOutboundQueueItem(nextQueue, sentItem);
        setOutboundQueue(nextQueue);
        setSummary(
          response.accepted
            ? `Queued ${response.envelopeCount} encrypted envelope${response.envelopeCount === 1 ? '' : 's'}.`
            : 'Encrypted message fanout was not accepted.',
        );
        return sentItem;
      } catch (error) {
        const failedItem: OutboundQueueItem = {
          ...sendingItem,
          state: 'failed',
          updatedAt: new Date().toISOString(),
          lastError: error instanceof Error ? error.message : 'Encrypted message fanout failed.',
        };
        nextQueue = await replaceOutboundQueueItem(nextQueue, failedItem);
        setOutboundQueue(nextQueue);
        setSummary(`Encrypted message queued locally. Retry when the API is available.`);
        return failedItem;
      }
    },
    [
      bootstrapPrototypeSession,
      liveClient,
      messageCryptoReadiness,
      messageEncryptionProvider,
      mode,
      outboundQueue,
      remoteTrustRecords,
      session,
    ],
  );

  const retryOutboundMessage = useCallback(
    async (itemId: string) => {
      const item = outboundQueue.find((queued) => queued.id === itemId);

      if (!item) {
        throw new Error('Outbound queue item was not found.');
      }

      assertCanPrepareOutboundFanout(mode, messageCryptoReadiness);

      if (mode === 'live' && !session?.token) {
        throw new Error('Live retry requires a verified device session.');
      }

      const activeSession = session ?? (mode === 'mock' ? await bootstrapPrototypeSession() : null);

      if (!activeSession) {
        throw new Error('Start a verified device session before retrying.');
      }

      const recipient = remoteTrustRecords.find((record) => record.id === item.recipientRecordId);
      assertRecipientTrustedForSend(recipient);

      let nextQueue = await updateOutboundQueueItem(outboundQueue, item.id, (current) => ({
        ...current,
        state: 'sending',
        attemptCount: current.attemptCount + 1,
        updatedAt: new Date().toISOString(),
        lastError: undefined,
      }));
      setOutboundQueue(nextQueue);

      try {
        const response =
          mode === 'mock'
            ? await mockCipherChatApiClient.sendEnvelopeFanout(item.fanout)
            : await liveClient.sendEnvelopeFanout(item.fanout, activeSession.token);
        nextQueue = await updateOutboundQueueItem(nextQueue, item.id, (current) => ({
          ...current,
          state: response.accepted ? 'sent' : 'failed',
          envelopeCount: response.envelopeCount,
          sentAt: response.accepted ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
          lastError: response.accepted ? undefined : 'Encrypted message fanout was not accepted.',
        }));
      } catch (error) {
        nextQueue = await updateOutboundQueueItem(nextQueue, item.id, (current) => ({
          ...current,
          state: 'failed',
          updatedAt: new Date().toISOString(),
          lastError: error instanceof Error ? error.message : 'Encrypted message retry failed.',
        }));
      }

      setOutboundQueue(nextQueue);
      const updated = nextQueue.find((queued) => queued.id === item.id) ?? item;
      setSummary(
        updated.state === 'sent'
          ? `Retried and queued ${updated.envelopeCount} encrypted envelope${updated.envelopeCount === 1 ? '' : 's'}.`
          : 'Encrypted message remains queued locally.',
      );
      return updated;
    },
    [bootstrapPrototypeSession, liveClient, messageCryptoReadiness, mode, outboundQueue, remoteTrustRecords, session],
  );

  const pollInboundEnvelopes = useCallback(async () => {
    if (mode === 'live' && !session?.token) {
      const unavailableStatus = createInboundStatus(inboundSyncState, {
        pendingCount: inboundEnvelopeStatus.pendingCount,
        acknowledgedCount: inboundEnvelopeStatus.acknowledgedCount,
        pageCount: inboundEnvelopeStatus.pageCount,
        lastPolledAt: inboundEnvelopeStatus.lastPolledAt,
        lastError: 'Live inbound polling requires a verified device session.',
      });
      setInboundEnvelopeStatus(unavailableStatus);
      throw new Error(unavailableStatus.lastError);
    }

    const activeSession = session ?? (mode === 'mock' ? await bootstrapPrototypeSession() : null);

    if (!activeSession) {
      const unavailableStatus = createInboundStatus(inboundSyncState, {
        pendingCount: inboundEnvelopeStatus.pendingCount,
        acknowledgedCount: inboundEnvelopeStatus.acknowledgedCount,
        pageCount: inboundEnvelopeStatus.pageCount,
        lastPolledAt: inboundEnvelopeStatus.lastPolledAt,
        lastError: 'Start a verified device session before polling encrypted envelopes.',
      });
      setInboundEnvelopeStatus(unavailableStatus);
      throw new Error(unavailableStatus.lastError);
    }

    if (mode === 'live') {
      try {
        assertCanProcessInboundEnvelopes(mode, messageCryptoReadiness);
      } catch (error) {
        const unavailableStatus = createInboundStatus(inboundSyncState, {
          pendingCount: inboundEnvelopeStatus.pendingCount,
          acknowledgedCount: inboundEnvelopeStatus.acknowledgedCount,
          pageCount: inboundEnvelopeStatus.pageCount,
          lastPolledAt: inboundEnvelopeStatus.lastPolledAt,
          lastError: error instanceof Error ? error.message : 'Production inbound crypto is unavailable.',
        });
        setInboundEnvelopeStatus(unavailableStatus);
        throw error;
      }
    }

    setInboundEnvelopeStatus((current) => ({
      ...current,
      polling: true,
      lastError: undefined,
    }));

    try {
      let cursor = inboundSyncState.nextCursor;
      let nextSyncState = inboundSyncState;
      let pendingCount = 0;
      let acknowledgedCount = 0;
      let pageCount = 0;
      const maxPages = 5;

      do {
        const page =
          mode === 'mock'
            ? await mockCipherChatApiClient.getPendingEnvelopes()
            : await liveClient.getPendingEnvelopes({
                token: activeSession.token,
                limit: 25,
                cursor,
              });
        const acknowledgements = await Promise.all(
          page.envelopes.map((envelope) =>
            mode === 'mock'
              ? mockCipherChatApiClient.acknowledgeEnvelope(envelope.messageId)
              : liveClient.acknowledgeEnvelope(envelope.messageId, activeSession.token),
          ),
        );
        const polledAt = new Date().toISOString();
        nextSyncState = await mergeInboundDeliveryReceipts(nextSyncState, {
          cursor,
          nextCursor: page.nextCursor,
          fetched: page.envelopes,
          acknowledgements,
          polledAt,
        });

        pendingCount += page.envelopes.length;
        acknowledgedCount += acknowledgements.length;
        pageCount += 1;
        cursor = page.nextCursor;
      } while (cursor && pageCount < maxPages);

      setInboundSyncState(nextSyncState);
      const nextStatus = createInboundStatus(nextSyncState, {
        pendingCount,
        acknowledgedCount,
        pageCount,
      });

      setInboundEnvelopeStatus(nextStatus);
      setSummary(
        pendingCount > 0
          ? `Fetched and acknowledged ${acknowledgedCount} encrypted envelope${acknowledgedCount === 1 ? '' : 's'} across ${pageCount} page${pageCount === 1 ? '' : 's'}.`
          : 'No pending encrypted envelopes for this device.',
      );
      return nextStatus;
    } catch (error) {
      const failedStatus = createInboundStatus(inboundSyncState, {
        pendingCount: inboundEnvelopeStatus.pendingCount,
        acknowledgedCount: inboundEnvelopeStatus.acknowledgedCount,
        pageCount: inboundEnvelopeStatus.pageCount,
        lastPolledAt: inboundEnvelopeStatus.lastPolledAt,
        lastError: error instanceof Error ? error.message : 'Encrypted envelope polling failed.',
      });
      setInboundEnvelopeStatus(failedStatus);
      setSummary('Encrypted inbox polling failed.');
      return failedStatus;
    }
  }, [bootstrapPrototypeSession, inboundEnvelopeStatus, inboundSyncState, liveClient, messageCryptoReadiness, mode, session]);

  const trustRemoteIdentity = useCallback(
    async (recordId: string) => {
      const nextRecords = await markRemoteTrustRecordTrusted(remoteTrustRecords, recordId);
      const record = nextRecords.find((item) => item.id === recordId);
      setRemoteTrustRecords(nextRecords);
      setSummary(record ? `${record.displayName} safety number trusted.` : 'Remote identity trusted.');
    },
    [remoteTrustRecords],
  );

  const clearSession = useCallback(async () => {
    if (mode === 'live' && session?.token) {
      try {
        await liveClient.revokeCurrentSession(session.token);
      } catch {
        // Local cleanup still matters if the server is unavailable.
      }
    }

    await clearStoredApiSession();
    setSession(null);
    setAccountDevices([]);
    setDevicePrekeyStatus(null);
  }, [liveClient, mode, session?.token]);

  const revokeCurrentDevice = useCallback(async () => {
    if (!session) {
      throw new Error('Start a verified device session before revoking this device.');
    }

    if (mode === 'mock') {
      await mockCipherChatApiClient.revokeDevice({
        accountId: session.accountId,
        deviceId: session.deviceId,
      });
    } else {
      await liveClient.revokeDevice({
        accountId: session.accountId,
        deviceId: session.deviceId,
        token: session.token,
      });
    }

    await clearStoredApiSession();
    setSession(null);
    setAccountDevices([]);
    setDevicePrekeyStatus(null);
    setSummary('This device was revoked. Verify again before sending or receiving encrypted envelopes.');
  }, [liveClient, mode, session]);

  const revokeAccountDevice = useCallback(
    async (deviceId: string) => {
      if (!session) {
        throw new Error('Start a verified device session before revoking account devices.');
      }

      if (mode === 'mock') {
        await mockCipherChatApiClient.revokeDevice({
          accountId: session.accountId,
          deviceId,
        });
      } else {
        await liveClient.revokeDevice({
          accountId: session.accountId,
          deviceId,
          token: session.token,
        });
      }

      if (deviceId === session.deviceId) {
        await clearStoredApiSession();
        setSession(null);
        setAccountDevices([]);
        setDevicePrekeyStatus(null);
      } else {
        setAccountDevices((current) =>
          current.map((device) =>
            device.deviceId === deviceId
              ? {
                  ...device,
                  revokedAt: new Date().toISOString(),
                }
              : device,
          ),
        );
      }

      setSummary('Account device was revoked.');
    },
    [liveClient, mode, session],
  );

  const value = useMemo<BackendContextValue>(
    () => ({
      status: {
        mode,
        baseUrl,
        ready,
        sessionActive: Boolean(session),
        summary,
        identityFingerprint: identity?.fingerprint,
        identitySafetyNumber: trustStatus?.record.safetyNumberBlocks,
        identityTrustState: trustStatus?.state,
        cryptoProvider: identity?.provider,
        messageCryptoProvider: messageCryptoReadiness.provider,
        messageCryptoReady: canSendWithMessageCrypto(mode, messageCryptoReadiness),
        messageCryptoSummary: `${messageCryptoReadiness.label} - ${messageCryptoReadiness.detail}`,
        remoteTrustSyncing: syncingRemoteTrust,
      },
      session,
      initializing,
      remoteTrustRecords,
      contactDiscoveryResults,
      accountDevices,
      devicePrekeyStatus,
      outboundQueue,
      inboundEnvelopeStatus,
      setMode: persistMode,
      setBaseUrl: persistBaseUrl,
      refreshStatus,
      bootstrapPrototypeSession,
      trustCurrentDeviceIdentity,
      rotateDeviceIdentity,
      discoverContacts,
      refreshAccountDevices,
      refreshDevicePrekeyStatus,
      addDiscoveredContact,
      sendSecureMessage,
      retryOutboundMessage,
      pollInboundEnvelopes,
      syncRemoteIdentity,
      trustRemoteIdentity,
      revokeAccountDevice,
      revokeCurrentDevice,
      clearSession,
    }),
    [accountDevices, addDiscoveredContact, baseUrl, bootstrapPrototypeSession, clearSession, contactDiscoveryResults, devicePrekeyStatus, discoverContacts, identity?.fingerprint, identity?.provider, inboundEnvelopeStatus, initializing, messageCryptoReadiness, mode, outboundQueue, persistBaseUrl, persistMode, pollInboundEnvelopes, ready, refreshAccountDevices, refreshDevicePrekeyStatus, refreshStatus, remoteTrustRecords, retryOutboundMessage, revokeAccountDevice, revokeCurrentDevice, rotateDeviceIdentity, sendSecureMessage, session, summary, syncRemoteIdentity, syncingRemoteTrust, trustCurrentDeviceIdentity, trustRemoteIdentity, trustStatus?.record.safetyNumberBlocks, trustStatus?.state],
  );

  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>;
}
