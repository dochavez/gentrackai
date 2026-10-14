import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, Palette, Radius } from '@/constants/design';

/** Formats a date for display in the field (e.g. "Aug 3, 2026"). */
function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Labeled date input matching `TextField`. Tapping the field reveals the native
 * date picker (`@expo/ui`'s SwiftUI/Compose picker natively; an inline control
 * on web). Presentational — the parent owns the selected `value`.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Pick a date',
  minimumDate,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen((prev) => !prev)} accessibilityRole="button" style={styles.field}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </Pressable>
      {open ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={value ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : undefined}
            minimumDate={minimumDate}
            accentColor={Palette.gold}
            onValueChange={(_event, date) => {
              onChange(date);
              setOpen(false);
            }}
            onDismiss={() => setOpen(false)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted, marginBottom: 6 },
  field: {
    height: 52,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  value: { fontSize: 15, fontFamily: Font.regular, color: Palette.ink },
  placeholder: { color: Palette.placeholder },
  pickerWrap: { marginTop: 8 },
});
