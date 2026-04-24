import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppLogo } from '../../components/common/AppLogo';
import { DarkCard } from '../../components/common/DarkCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SectionHeader } from '../../components/common/SectionHeader';
import { SettingRow } from '../../components/settings/SettingRow';
import { ONBOARDING_STORAGE_KEY } from '../../constants/storage';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [readReceipts, setReadReceipts] = useState(false);
  const [appLock, setAppLock] = useState(true);
  const [disappearing, setDisappearing] = useState(true);

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    navigation.replace('Onboarding');
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Settings" subtitle="Privacy and account controls">
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('PrivacyDashboard')}>
          <Ionicons name="shield-checkmark" size={20} color={colors.text} />
        </TouchableOpacity>
      </ScreenHeader>

      <DarkCard style={styles.profile}>
        <AppLogo size={48} variant="horizontal" />
        <Text style={styles.profileText}>Secure. Private. Yours alone.</Text>
      </DarkCard>

      <SectionHeader title="Account" />
      <View style={styles.group}>
        <SettingRow icon="person" title="Account" subtitle="Profile, email, and recovery" />
        <SettingRow icon="shield-checkmark" title="Privacy Dashboard" subtitle="97% privacy score" onPress={() => navigation.navigate('PrivacyDashboard')} />
        <SettingRow icon="phone-portrait" title="Device Verification" subtitle="Manage trusted devices" onPress={() => navigation.navigate('DeviceVerification')} />
      </View>

      <SectionHeader title="Privacy & Security" />
      <View style={styles.group}>
        <SettingRow icon="key" title="Safety Number" subtitle="Verify contacts manually" />
        <SettingRow icon="checkmark-done" title="Read Receipts" subtitle="Control delivery transparency" value={readReceipts} onValueChange={setReadReceipts} />
        <SettingRow icon="timer" title="Disappearing Messages" subtitle="Default timer: 30 seconds" value={disappearing} onValueChange={setDisappearing} />
        <SettingRow icon="lock-closed" title="App Lock" subtitle="Require biometric unlock" value={appLock} onValueChange={setAppLock} />
        <SettingRow icon="finger-print" title="Two-Step Verification" subtitle="Add a security PIN" />
        <SettingRow icon="ban" title="Blocked Contacts" subtitle="3 blocked identities" />
      </View>

      <SectionHeader title="App" />
      <View style={styles.group}>
        <SettingRow icon="notifications" title="Notifications" subtitle="Private previews enabled" />
        <SettingRow icon="file-tray-full" title="Data & Storage" subtitle="Encrypted local only" />
        <SettingRow icon="help-circle" title="Help & Support" subtitle="Security guide and support" />
        <SettingRow icon="information-circle" title="About CipherChat" subtitle="Version and credits" onPress={() => navigation.navigate('About')} />
      </View>

      <TouchableOpacity style={styles.reset} onPress={resetOnboarding}>
        <Text style={styles.resetText}>Reset onboarding prototype</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 110,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profile: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  profileText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  group: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.82)',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  reset: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  resetText: {
    ...typography.small,
    color: colors.primaryBright,
  },
});
