import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { CloseIcon } from '@/components/ui/icons/close-icon';
import { Font, Palette, Radius } from '@/constants/design';
import type { Option } from '@/constants/locations';

export type MultiSelectFieldProps = {
  label: string;
  values: string[];
  onToggle: (value: string) => void;
  options: Option[];
  placeholder?: string;
};

/**
 * Labeled multi-select matching `SelectField`. The field summarizes the current
 * selection; tapping opens a searchable, checkable list. Presentational — the
 * parent owns `values` and toggles them.
 */
export function MultiSelectField({
  label,
  values,
  onToggle,
  options,
  placeholder = 'Select…',
}: MultiSelectFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const summary = useMemo(() => {
    if (values.length === 0) return null;
    const labels = values
      .map((v) => options.find((o) => o.value === v)?.label ?? v)
      .sort();
    return labels.length <= 3 ? labels.join(', ') : `${labels.length} selected`;
  }, [values, options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={styles.field}>
        <Text style={[styles.value, !summary && styles.placeholder]} numberOfLines={1}>
          {summary ?? placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={close} hitSlop={10} accessibilityLabel="Close">
                <CloseIcon size={20} color={Palette.ink} />
              </Pressable>
            </View>

            <TextInput
              placeholder="Search…"
              placeholderTextColor={Palette.placeholder}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              style={styles.search}
            />

            <FlatList
              data={filtered}
              keyExtractor={(o) => o.value}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => {
                const on = values.includes(item.value);
                return (
                  <Pressable style={styles.row} onPress={() => onToggle(item.value)}>
                    <Text style={[styles.rowText, on && styles.rowTextOn]}>{item.label}</Text>
                    {on ? <CheckCircleIcon size={20} color={Palette.gold} /> : <View style={styles.dot} />}
                  </Pressable>
                );
              }}
            />

            <View style={styles.footer}>
              <Button
                label={values.length > 0 ? `Done · ${values.length} selected` : 'Done'}
                onPress={close}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted, marginBottom: 6 },
  field: {
    minHeight: 52,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { flex: 1, fontSize: 15, fontFamily: Font.regular, color: Palette.ink },
  placeholder: { color: Palette.placeholder },
  chevron: { marginLeft: 8, fontSize: 14, color: Palette.textMuted },
  backdrop: { flex: 1, backgroundColor: 'rgba(27,23,18,0.35)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '82%',
    backgroundColor: Palette.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: { fontFamily: Font.displayBold, fontSize: 18, color: Palette.ink },
  search: {
    height: 46,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: Font.regular,
    color: Palette.ink,
    marginBottom: 8,
  },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.hairline,
  },
  rowText: { fontFamily: Font.medium, fontSize: 15.5, color: Palette.ink },
  rowTextOn: { fontFamily: Font.bold, color: Palette.goldText },
  dot: { width: 20, height: 20 },
  footer: { paddingTop: 12 },
});
