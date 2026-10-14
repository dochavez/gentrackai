import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { EyeIcon } from '@/components/ui/icons/eye-icon';
import { EyeOffIcon } from '@/components/ui/icons/eye-off-icon';
import { Font, Palette, Radius } from '@/constants/design';

export type TextFieldProps = TextInputProps & {
  /** Label rendered above the input. */
  label: string;
};

/**
 * Labeled text input (label above a rounded, bordered field). When
 * `secureTextEntry` is set, a show/hide toggle appears on the right so the
 * value can be revealed while typing.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, style, secureTextEntry, ...rest },
  ref
) {
  const [revealed, setRevealed] = useState(false);
  const isSecure = Boolean(secureTextEntry);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          ref={ref}
          placeholderTextColor={Palette.placeholder}
          secureTextEntry={isSecure && !revealed}
          style={[styles.input, isSecure && styles.inputSecure, style]}
          {...rest}
        />
        {isSecure && (
          <Pressable
            onPress={() => setRevealed((prev) => !prev)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={styles.toggle}>
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: Palette.textMuted,
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    paddingHorizontal: 15,
    fontSize: 15,
    fontFamily: Font.regular,
    color: Palette.ink,
  },
  inputSecure: {
    paddingRight: 48,
  },
  toggle: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
