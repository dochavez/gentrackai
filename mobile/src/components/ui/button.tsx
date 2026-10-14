import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, Palette, Radius } from '@/constants/design';

export type ButtonVariant = 'primary' | 'outline';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  /** `primary` = filled gold CTA; `outline` = white bordered (e.g. social). */
  variant?: ButtonVariant;
  /** Optional leading element (e.g. a provider icon). */
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.outline,
        pressed && styles.pressed,
        isDisabled && styles.dimmed,
      ]}>
      {loading ? (
        <ActivityIndicator color={Palette.ink} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={isPrimary ? styles.primaryLabel : styles.outlineLabel}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primary: {
    height: 56,
    borderRadius: Radius.button,
    backgroundColor: Palette.gold,
    shadowColor: Palette.gold,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  outline: {
    height: 52,
    borderRadius: Radius.input,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.hairline,
  },
  primaryLabel: {
    fontFamily: Font.extrabold,
    fontSize: 16,
    color: Palette.ink,
  },
  outlineLabel: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: Palette.ink,
  },
  pressed: {
    opacity: 0.9,
  },
  dimmed: {
    opacity: 0.6,
  },
});
