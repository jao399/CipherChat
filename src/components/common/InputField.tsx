import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { useLanguage } from '../../i18n';

type InputFieldProps = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function InputField({ label, icon, style, ...props }: InputFieldProps) {
  const { textAlign, rowDirection } = useLanguage();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { textAlign }]}>{label}</Text> : null}
      <View style={[styles.field, { flexDirection: rowDirection }, focused && styles.focused]}>
        {icon ? <Ionicons name={icon} size={19} color={focused ? colors.primaryBright : colors.muted} /> : null}
        <TextInput
          {...props}
          placeholderTextColor={colors.muted}
          style={[styles.input, { textAlign }, style]}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
        />
      </View>
    </View>
  );
}

export function PasswordField({ label = 'Password', ...props }: InputFieldProps) {
  const { textAlign, rowDirection } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { textAlign }]}>{label}</Text>
      <View style={[styles.field, { flexDirection: rowDirection }, focused && styles.focused]}>
        <Ionicons name="lock-closed" size={19} color={focused ? colors.primaryBright : colors.muted} />
        <TextInput
          {...props}
          secureTextEntry={!visible}
          placeholderTextColor={colors.muted}
          style={[styles.input, { textAlign }]}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={visible ? `Hide ${label}` : `Show ${label}`}
          onPress={() => setVisible((value) => !value)}
          hitSlop={8}
        >
          <Ionicons name={visible ? 'eye-off' : 'eye'} size={19} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
  },
  field: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  focused: {
    borderColor: colors.primaryBright,
    shadowColor: colors.primaryBright,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: spacing.sm,
  },
});
