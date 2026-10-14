export type GeneratorStatus = 'running' | 'needs_care' | 'offline';

/** Matches the backend GeneratorResource (camelCase). */
export type Generator = {
  id: string;
  name: string;
  manufacturer: string | null;
  modelNumber: string | null;
  ratedPower: string | null;
  fuelType: string | null;
  type: string | null;
  serialNumber: string | null;
  transferSwitch: string | null;
  serviceInterval: string | null;
  location: string | null;
  status: GeneratorStatus;
  /** Whether the usage clock is ticking (status running + started). */
  isRunning: boolean;
  /** Backend live projection (see GeneratorUsage) — the app never derives these. */
  runHours: number;
  fuelLevel: number | null;
  batteryVoltage: number | null;
  /** % of tank burned per running hour (estimate; null = unknown). */
  fuelBurnRate: number | null;
  /** Presentation-ready captions: "Updating live" / "as of 2 hours ago" / null. */
  fuelCaption: string | null;
  runHoursCaption: string | null;
  batteryCaption: string | null;
  installedAt: string | null;
  imageUrl: string | null;
  confidence: number | null;
  createdAt: string | null;
  /** Backend-formatted "added N ago" (never derived in the app). */
  addedAgo: string | null;
};

/** A logged usage reading (matches the backend GeneratorReadingResource). */
export type ReadingMetric = 'fuel' | 'run_hours' | 'battery';

export type GeneratorReading = {
  id: string;
  metric: ReadingMetric;
  metricLabel: string;
  value: number;
  valueLabel: string;
  note: string | null;
  recordedAt: string | null;
  recordedAgo: string | null;
};

/** Editable spec-sheet field keys (snake_case, matching the update payload). */
export type EditGeneratorSpecKey =
  | 'manufacturer'
  | 'model_number'
  | 'rated_power'
  | 'fuel_type'
  | 'type'
  | 'serial_number'
  | 'transfer_switch'
  | 'service_interval';

/**
 * Values managed by the edit-generator form. All text fields are strings;
 * `status` is a segmented choice; `burnRate` is the raw text of a % rate.
 */
export type EditGeneratorValues = {
  name: string;
  location: string;
  status: GeneratorStatus;
  burnRate: string;
  manufacturer: string;
  model_number: string;
  rated_power: string;
  fuel_type: string;
  type: string;
  serial_number: string;
  transfer_switch: string;
  service_interval: string;
};

/**
 * Extracted specs returned by `POST /generators/scan` (snake_case — echoed
 * straight back to `POST /generators` when the user confirms).
 */
export type ScanResult = {
  is_generator: boolean;
  confidence: number;
  name: string | null;
  manufacturer: string | null;
  model_number: string | null;
  rated_power: string | null;
  fuel_type: string | null;
  type: string | null;
  serial_number: string | null;
  transfer_switch: string | null;
  service_interval: string | null;
};
