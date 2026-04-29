import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DarkCard } from '../../components/common/DarkCard';
import { LoadingState } from '../../components/common/LoadingState';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useBackend } from '../../hooks/useBackend';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { AccountDevice } from '../../services/api/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DeviceManagement'>;

export function DeviceManagementScreen({ navigation }: Props) {
  const {
    accountDevices,
    devicePrekeyStatus,
    refreshAccountDevices,
    refreshDevicePrekeyStatus,
    revokeAccountDevice,
    status,
  } = useBackend();
  const [loading, setLoading] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);

  const loadDevices = async () => {
    setLoading(true);

    try {
      await Promise.all([refreshAccountDevices(), refreshDevicePrekeyStatus()]);
    } catch (error) {
      Alert.alert(
        'Device list unavailable',
        error instanceof Error ? error.message : 'CipherChat could not load account devices.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDevices();
    // Load once when the screen opens; manual refresh handles subsequent reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmRevoke = (device: AccountDevice) => {
    Alert.alert(
      device.isCurrentDevice ? 'Revoke this device?' : `Revoke ${device.deviceName}?`,
      device.isCurrentDevice
        ? 'This device will lose its active session and must be verified again.'
        : 'This device will be removed from public key discovery and its active sessions will be invalidated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Device',
          style: 'destructive',
          onPress: () => {
            setRevokingDeviceId(device.deviceId);
            void revokeAccountDevice(device.deviceId)
              .then(() => (device.isCurrentDevice ? undefined : refreshAccountDevices()))
              .then(() => {
                Alert.alert('Device revoked', 'CipherChat updated account device access.');
              })
              .catch((error) => {
                Alert.alert(
                  'Revocation failed',
                  error instanceof Error ? error.message : 'CipherChat could not revoke this device.',
                );
              })
              .finally(() => setRevokingDeviceId(null));
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back from device management"
          testID="device-management-back"
          style={styles.back}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Refresh account devices"
          testID="device-management-refresh"
          style={styles.refresh}
          onPress={loadDevices}
        >
          <Ionicons name="refresh" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Device Management</Text>
      <Text style={styles.subtitle}>Review trusted devices, active sessions, and revoked access.</Text>

      <DarkCard style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Ionicons name="phone-portrait" size={24} color={colors.primaryBright} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.summaryTitle}>{status.sessionActive ? 'Verified session active' : 'No active session'}</Text>
          <Text style={styles.summarySubtitle}>{status.identityFingerprint ?? 'Verify this device before loading live account devices.'}</Text>
        </View>
      </DarkCard>

      <DarkCard style={styles.prekeyCard}>
        <View style={styles.summaryIcon}>
          <Ionicons
            name={devicePrekeyStatus?.needsTopUp ? 'warning' : 'key'}
            size={24}
            color={devicePrekeyStatus?.needsTopUp ? colors.primaryBright : colors.security}
          />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.summaryTitle}>
            {devicePrekeyStatus ? `${devicePrekeyStatus.oneTimePrekeyCount} one-time prekeys` : 'Prekey inventory unavailable'}
          </Text>
          <Text style={styles.summarySubtitle}>
            {devicePrekeyStatus
              ? devicePrekeyStatus.needsTopUp
                ? `Below low watermark ${devicePrekeyStatus.lowWatermark}; top-up path is required before production.`
                : `Healthy. Recommended inventory is ${devicePrekeyStatus.recommendedCount}.`
              : 'Refresh after starting a verified session.'}
          </Text>
        </View>
      </DarkCard>

      {loading ? <LoadingState label="Loading account devices..." /> : null}

      <View style={styles.list}>
        {accountDevices.map((device) => {
          const revoked = Boolean(device.revokedAt);
          const revoking = revokingDeviceId === device.deviceId;

          return (
            <DarkCard key={device.deviceId} style={styles.deviceCard}>
              <View style={styles.deviceIcon}>
                <Ionicons name={revoked ? 'ban' : 'phone-portrait'} size={24} color={revoked ? colors.muted : colors.primaryBright} />
              </View>
              <View style={styles.deviceBody}>
                <View style={styles.deviceTitleRow}>
                  <Text style={styles.deviceName}>{device.deviceName}</Text>
                  {device.isCurrentDevice ? <Text style={styles.currentBadge}>CURRENT</Text> : null}
                </View>
                <Text style={styles.deviceMeta}>{device.deviceId}</Text>
                <Text style={revoked ? styles.revokedText : styles.activeText}>
                  {revoked ? `Revoked ${formatDate(device.revokedAt)}` : `Last seen ${formatDate(device.lastSeenAt)}`}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Revoke ${device.deviceName}`}
                testID={`device-management-revoke-${device.deviceId}`}
                disabled={revoked || revoking}
                style={[styles.revokeButton, (revoked || revoking) && styles.revokeButtonDisabled]}
                onPress={() => confirmRevoke(device)}
              >
                <Ionicons name={revoking ? 'sync' : 'trash'} size={18} color={revoked ? colors.muted : colors.text} />
              </TouchableOpacity>
            </DarkCard>
          );
        })}
      </View>

      {!loading && accountDevices.length === 0 ? (
        <DarkCard style={styles.empty}>
          <Ionicons name="shield-outline" size={28} color={colors.primaryBright} />
          <Text style={styles.emptyTitle}>No devices loaded</Text>
          <Text style={styles.emptyText}>Start a verified session, then refresh this screen.</Text>
        </DarkCard>
      ) : null}
    </ScreenContainer>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return 'unknown';
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 110,
  },
  topBar: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refresh: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.subtitle,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  prekeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,45,255,0.12)',
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  summarySubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,45,255,0.14)',
  },
  deviceBody: {
    flex: 1,
    gap: 3,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deviceName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
    flexShrink: 1,
  },
  currentBadge: {
    ...typography.small,
    color: colors.primaryBright,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  deviceMeta: {
    ...typography.small,
    color: colors.muted,
  },
  activeText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  revokedText: {
    ...typography.small,
    color: colors.muted,
  },
  revokeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revokeButtonDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  emptyText: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
