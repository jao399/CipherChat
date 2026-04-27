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
  getIdentityTrustStatus,
  markIdentityTrusted,
  prototypeDeviceIdentityProvider,
  type IdentityTrustStatus,
  type LocalDeviceIdentity,
} from '../../security';
import { CipherChatApiClient } from './cipherChatApiClient';
import { getStoredApiSession, setStoredApiSession, clearStoredApiSession, type StoredApiSession } from './apiSessionStore';
import { mockCipherChatApiClient } from './mockCipherChatApiClient';
import type { BackendStatus } from './types';

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
  clearSession(): Promise<void>;
};

export const BackendContext = createContext<BackendContextValue | null>(null);

function summarizeReadiness(mode: BackendMode, ready: boolean, checks?: BackendStatus['summary']) {
  if (mode === 'mock') {
    return 'Mock mode active. UI demo data stays local.';
  }

  return ready ? 'Live API connected.' : checks ?? 'Live API unavailable.';
}

export function BackendProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<BackendMode>(DEFAULT_BACKEND_MODE);
  const [baseUrl, setBaseUrlState] = useState(DEFAULT_API_BASE_URL);
  const [ready, setReady] = useState(false);
  const [summary, setSummary] = useState('Backend status not checked yet.');
  const [session, setSession] = useState<StoredApiSession | null>(null);
  const [identity, setIdentity] = useState<LocalDeviceIdentity | null>(null);
  const [trustStatus, setTrustStatus] = useState<IdentityTrustStatus | null>(null);
  const [initializing, setInitializing] = useState(true);

  const liveClient = useMemo(() => new CipherChatApiClient(baseUrl), [baseUrl]);

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
      const [storedMode, storedBaseUrl, storedSession, storedIdentity] = await Promise.all([
        AsyncStorage.getItem(API_MODE_STORAGE_KEY),
        AsyncStorage.getItem(API_BASE_URL_STORAGE_KEY),
        getStoredApiSession(),
        prototypeDeviceIdentityProvider.getOrCreateIdentity(),
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
  }, [liveClient, mode, session?.token]);

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
      },
      session,
      initializing,
      setMode: persistMode,
      setBaseUrl: persistBaseUrl,
      refreshStatus,
      bootstrapPrototypeSession,
      trustCurrentDeviceIdentity,
      rotateDeviceIdentity,
      clearSession,
    }),
    [baseUrl, bootstrapPrototypeSession, clearSession, identity?.fingerprint, identity?.provider, initializing, mode, persistBaseUrl, persistMode, ready, refreshStatus, rotateDeviceIdentity, session, summary, trustCurrentDeviceIdentity, trustStatus?.record.safetyNumberBlocks, trustStatus?.state],
  );

  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>;
}
