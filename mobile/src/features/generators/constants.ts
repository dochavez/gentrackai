import type {
  EditGeneratorSpecKey,
  GeneratorStatus,
  ReadingMetric,
} from '@/features/generators/types';

/** Selectable running-status options for the edit-generator segmented control. */
export const STATUSES: { key: GeneratorStatus; label: string }[] = [
  { key: 'running', label: 'Running' },
  { key: 'needs_care', label: 'Needs care' },
  { key: 'offline', label: 'Offline' },
];

/** Spec-sheet fields rendered as plain text inputs on the edit screen. */
export const SPEC_FIELDS: { key: EditGeneratorSpecKey; label: string }[] = [
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'model_number', label: 'Model number' },
  { key: 'rated_power', label: 'Rated output' },
  { key: 'fuel_type', label: 'Fuel type' },
  { key: 'type', label: 'Type' },
  { key: 'serial_number', label: 'Serial number' },
  { key: 'transfer_switch', label: 'Transfer switch' },
  { key: 'service_interval', label: 'Service interval' },
];

/**
 * Whether the live-monitoring gauges (Fuel %, Battery V) are shown on the
 * generator detail screen. Hidden for now — the app isn't a live-monitoring
 * product, so those values can't be sourced automatically. The reading/logging
 * functionality behind them stays intact (see METRICS + the log-reading flow),
 * so flip this back to `true` to re-enable the gauges (e.g. if sold to a brand
 * whose generators expose the data).
 */
export const MONITORING_GAUGES_ENABLED = false;

/** Loggable usage metrics for the log-reading segmented control. */
export const METRICS: { key: ReadingMetric; label: string; unit: string; placeholder: string }[] = [
  { key: 'fuel', label: 'Fuel', unit: '%', placeholder: '0–100' },
  { key: 'run_hours', label: 'Run hours', unit: 'hrs', placeholder: 'e.g. 1240' },
  { key: 'battery', label: 'Battery', unit: 'V', placeholder: 'e.g. 12.6' },
];
