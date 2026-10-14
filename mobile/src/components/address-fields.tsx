import { StyleSheet, View } from 'react-native';

import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { COUNTRIES, US_STATES } from '@/constants/locations';

export type AddressValues = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type Props = {
  values: AddressValues;
  /** Update a single address field (e.g. Formik's setFieldValue). */
  setField: (field: keyof AddressValues, value: string) => void;
};

/**
 * Shared service-address form block (country, street, city, state, ZIP). State
 * and country use searchable selects; the rest are text inputs. Controlled — the
 * parent owns `values`. Used by both sign-up and the profile editor.
 */
export function AddressFields({ values, setField }: Props) {
  return (
    <View style={styles.group}>
      <SelectField
        label="Country"
        value={values.country || 'US'}
        options={COUNTRIES}
        onSelect={(v) => setField('country', v)}
      />
      <TextField
        label="Street address"
        placeholder="123 Main St"
        autoCapitalize="words"
        value={values.addressLine1}
        onChangeText={(t) => setField('addressLine1', t)}
      />
      <TextField
        label="Apt / suite (optional)"
        placeholder="Unit 4"
        autoCapitalize="words"
        value={values.addressLine2}
        onChangeText={(t) => setField('addressLine2', t)}
      />
      <TextField
        label="City"
        placeholder="Los Angeles"
        autoCapitalize="words"
        value={values.city}
        onChangeText={(t) => setField('city', t)}
      />
      <View style={styles.row}>
        <View style={styles.state}>
          <SelectField
            label="State"
            value={values.state || null}
            options={US_STATES}
            placeholder="State"
            onSelect={(v) => setField('state', v)}
          />
        </View>
        <View style={styles.zip}>
          <TextField
            label="ZIP"
            placeholder="90001"
            keyboardType="number-pad"
            value={values.postalCode}
            onChangeText={(t) => setField('postalCode', t)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  state: { flex: 1 },
  zip: { width: 120 },
});
