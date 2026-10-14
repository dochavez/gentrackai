/**
 * Generators API. Matches the backend (see gentrackai-api routes/api.php):
 *   POST /generators/scan (multipart image)  -> { result }  (extract only)
 *   POST /generators      (multipart fields+image) -> { generator }
 *   GET  /generators/{id} -> { generator }
 * The list (`GET /generators`) is read via SWR with the default fetcher.
 */

import type {
  Generator,
  GeneratorReading,
  GeneratorStatus,
  ReadingMetric,
  ScanResult,
} from '@/features/generators/types';
import { api, getApiErrorMessage } from '@/services/api/client';
import { appendImage, MULTIPART, type ImageFile } from '@/services/api/upload';

export const GENERATORS_KEY = '/generators';

/** SWR key for one generator's detail. */
export function generatorKey(id: string): string {
  return `${GENERATORS_KEY}/${id}`;
}

/** SWR key for one generator's reading history (optionally filtered by metric). */
export function readingsKey(id: string, metric?: ReadingMetric): string {
  return `${GENERATORS_KEY}/${id}/readings${metric ? `?metric=${metric}` : ''}`;
}

export type { ImageFile } from '@/services/api/upload';

// The scan runs a Gemini vision+structured call server-side, so it can take
// longer than a normal request. Override the client's default (short) timeout
// so a slow-but-successful scan isn't aborted before the backend replies.
const SCAN_TIMEOUT_MS = 45_000;

/** Sends the label photo to the backend for Gemini extraction (nothing is saved yet). */
export async function scanGeneratorImage(image: ImageFile): Promise<ScanResult> {
  const form = new FormData();
  appendImage(form, image);
  try {
    const { data } = await api.post<{ result: ScanResult }>('/generators/scan', form, {
      ...MULTIPART,
      timeout: SCAN_TIMEOUT_MS,
    });
    return data.result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't read that label. Try a clearer photo of the nameplate."));
  }
}

/** Persists a generator from the confirmed scan result (re-uploads the photo). */
export async function createGenerator(result: ScanResult, image?: ImageFile): Promise<Generator> {
  const form = new FormData();
  const fields: Record<string, string | null> = {
    name: result.name ?? result.manufacturer ?? 'Generator',
    manufacturer: result.manufacturer,
    model_number: result.model_number,
    rated_power: result.rated_power,
    fuel_type: result.fuel_type,
    type: result.type,
    serial_number: result.serial_number,
    transfer_switch: result.transfer_switch,
    service_interval: result.service_interval,
    confidence: result.confidence != null ? String(Math.round(result.confidence)) : null,
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value != null && value !== '') form.append(key, value);
  }
  if (image) appendImage(form, image);
  try {
    const { data } = await api.post<{ generator: Generator }>('/generators', form, MULTIPART);
    return data.generator;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't add the generator. Please try again."));
  }
}

export async function fetchGenerator(id: string): Promise<Generator> {
  const { data } = await api.get<{ generator: Generator }>(`/generators/${id}`);
  return data.generator;
}

/** Editable generator fields (snake_case to match the backend request). */
export type UpdateGeneratorInput = {
  name?: string;
  manufacturer?: string | null;
  model_number?: string | null;
  rated_power?: string | null;
  fuel_type?: string | null;
  type?: string | null;
  serial_number?: string | null;
  transfer_switch?: string | null;
  service_interval?: string | null;
  location?: string | null;
  status?: GeneratorStatus;
  fuel_level?: number | null;
  run_hours?: number;
  battery_voltage?: number | null;
  fuel_burn_rate?: number | null;
};

/**
 * Edits a generator. With a new photo we POST multipart with `_method=PATCH`
 * (method spoofing — RN multipart uploads must be POST); otherwise a plain
 * JSON PATCH. Setting fuel/run_hours/battery logs a reading server-side.
 */
export async function updateGenerator(
  id: string,
  input: UpdateGeneratorInput,
  image?: ImageFile
): Promise<Generator> {
  try {
    if (image) {
      const form = new FormData();
      form.append('_method', 'PATCH');
      for (const [key, value] of Object.entries(input)) {
        if (value != null) form.append(key, String(value));
      }
      appendImage(form, image);
      const { data } = await api.post<{ generator: Generator }>(`/generators/${id}`, form, MULTIPART);
      return data.generator;
    }
    const { data } = await api.patch<{ generator: Generator }>(`/generators/${id}`, input);
    return data.generator;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't save the changes. Please try again."));
  }
}

/** Soft-deletes a generator (it and its tasks/maintenance drop out of the app). */
export async function deleteGenerator(id: string): Promise<void> {
  try {
    await api.delete(`/generators/${id}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't delete the generator. Please try again."));
  }
}

export type LogReadingInput = {
  metric: ReadingMetric;
  value: number;
  note?: string | null;
  recorded_at?: string | null;
};

/** Logs a usage reading; returns the reading plus the generator's fresh snapshot. */
export async function logReading(
  id: string,
  input: LogReadingInput
): Promise<{ reading: GeneratorReading; generator: Generator }> {
  try {
    const { data } = await api.post<{ reading: GeneratorReading; generator: Generator }>(
      `/generators/${id}/readings`,
      input
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't log that reading. Please try again."));
  }
}
