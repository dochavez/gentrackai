/**
 * Generator registration flow (mirrors the `/design` scan flow):
 *   capture (live camera) → analyzing (POST /generators/scan) → results sheet → add
 * The capture stage shows a live in-frame camera (expo-camera); the shutter
 * captures a photo, or the user can pick one from the gallery. The photo is sent
 * to the backend, which runs Gemini and returns the extracted specs to confirm.
 */

import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSWRConfig } from 'swr';

import { Button } from '@/components/ui/button';
import { BoltIcon } from '@/components/ui/icons/bolt-icon';
import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { CloseIcon } from '@/components/ui/icons/close-icon';
import { FleetIcon } from '@/components/ui/icons/fleet-icon';
import { ImageIcon } from '@/components/ui/icons/image-icon';
import { Font, Palette } from '@/constants/design';
import { SpecList, type SpecItem } from '@/features/generators/components/spec-list';
import { pickFromGallery } from '@/lib/pick-image';
import { prepareScanImage } from '@/features/generators/prepare-scan-image';
import type { ScanResult } from '@/features/generators/types';
import { createGenerator, GENERATORS_KEY, scanGeneratorImage, type ImageFile } from '@/services/api/generators';

type Stage = 'capture' | 'analyzing' | 'result';

export function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [stage, setStage] = useState<Stage>('capture');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const [image, setImage] = useState<ImageFile | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const cameraReady = permission?.granted === true;
  // Once denied, iOS won't show the prompt again — send the user to Settings.
  const cameraBlocked = permission?.granted === false && permission.canAskAgain === false;

  const runScan = async (picked: ImageFile) => {
    setError(null);
    setStage('analyzing');
    try {
      // Downscale before upload so it stays under the API's size limit and
      // uploads fast; the compact image is also what we later save via `onAdd`.
      const prepared = await prepareScanImage(picked);
      setImage(prepared);
      setResult(await scanGeneratorImage(prepared));
      setStage('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed. Please try again.');
      setStage('capture');
    }
  };

  const onShutter = async () => {
    if (!cameraRef.current || capturing) return;
    setError(null);
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        await runScan({ uri: photo.uri, name: 'label.jpg', mimeType: 'image/jpeg' });
      }
    } catch {
      setError('Could not capture the photo. Try again.');
    } finally {
      setCapturing(false);
    }
  };

  const onGallery = async () => {
    setError(null);
    try {
      const picked = await pickFromGallery();
      if (picked) await runScan(picked);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the gallery.');
    }
  };

  const onAdd = async () => {
    if (!result) return;
    setAdding(true);
    setError(null);
    try {
      const generator = await createGenerator(result, image ?? undefined);
      await mutate(GENERATORS_KEY);
      router.replace({ pathname: '/generators/[id]', params: { id: generator.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the generator.');
      setAdding(false);
    }
  };

  const rescan = () => {
    setStage('capture');
    setResult(null);
    setError(null);
  };

  const specItems: SpecItem[] = result
    ? (
        [
          ['Rated output', result.rated_power],
          ['Fuel type', result.fuel_type],
          ['Type', result.type],
          ['Serial', result.serial_number],
          ['Transfer switch', result.transfer_switch],
          ['Service interval', result.service_interval],
        ] as const
      )
        .filter(([, value]) => Boolean(value))
        .map(([label, value]) => ({ label, value: value as string }))
    : [];

  const subtitle = result
    ? [result.rated_power, result.type].filter(Boolean).join(' · ') +
      (result.model_number ? ` · Model ${result.model_number}` : '')
    : '';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {stage === 'capture' && cameraReady ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} />
      ) : null}

      {/* Header */}
      <View style={[styles.header, { top: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} accessibilityLabel="Close">
          <CloseIcon size={18} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Scan generator</Text>
        <View style={styles.headerBtn} />
      </View>

      {stage === 'capture' && (
        <>
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.reticle}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
              {!cameraReady ? <FleetIcon size={120} color="rgba(255,255,255,0.28)" /> : null}
            </View>
            <Text style={styles.instruction}>
              Position the generator&apos;s label inside the frame, or upload a photo from your gallery
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={[styles.controls, { paddingBottom: insets.bottom + 28 }]}>
            <Pressable onPress={onGallery} style={styles.sideBtn} accessibilityLabel="Choose from gallery">
              <ImageIcon size={24} color="#fff" />
            </Pressable>

            {cameraReady ? (
              <Pressable onPress={onShutter} disabled={capturing} style={styles.shutter} accessibilityLabel="Take photo">
                <View style={styles.shutterInner}>
                  {capturing ? <ActivityIndicator color={Palette.ink} /> : null}
                </View>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => (cameraBlocked ? Linking.openSettings() : requestPermission())}
                style={styles.enableBtn}>
                <Text style={styles.enableText}>{cameraBlocked ? 'Open Settings' : 'Continue'}</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
              disabled={!cameraReady}
              style={styles.sideBtn}
              accessibilityLabel="Toggle flash">
              <BoltIcon size={22} color={flash === 'on' ? Palette.gold : 'rgba(255,255,255,0.55)'} />
            </Pressable>
          </View>
        </>
      )}

      {stage === 'analyzing' && (
        <View style={styles.stage}>
          <View style={styles.analyzeFrame}>
            <FleetIcon size={130} color="rgba(255,197,49,0.4)" />
          </View>
          <View style={styles.analyzeRow}>
            <ActivityIndicator color={Palette.gold} />
            <Text style={styles.analyzeText}>Identifying model…</Text>
          </View>
          <Text style={styles.analyzeSub}>Reading the nameplate with AI</Text>
        </View>
      )}

      {stage === 'result' && result && (
        <View style={styles.sheetWrap}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
            <View style={styles.grabber} />
            <View style={styles.matchPill}>
              <CheckCircleIcon size={13} />
              <Text style={styles.matchText}>Match found · {Math.round(result.confidence)}% confidence</Text>
            </View>

            <View style={styles.resultHead}>
              <View style={styles.resultIcon}>
                <FleetIcon size={34} color={Palette.ink} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.resultName}>{result.name ?? result.manufacturer ?? 'Generator'}</Text>
                {subtitle ? <Text style={styles.resultSub}>{subtitle}</Text> : null}
              </View>
            </View>

            {specItems.length > 0 ? (
              <ScrollView style={styles.specScroll} contentContainerStyle={styles.specContent}>
                <SpecList items={specItems} />
              </ScrollView>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.resultActions}>
              <Button label="Add to my generators" onPress={onAdd} loading={adding} disabled={adding} />
              <Text style={styles.rescan} onPress={rescan}>
                Scan again
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.scanBg,
  },
  flex: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  reticle: {
    width: 264,
    height: 264,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderColor: Palette.gold,
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
  instruction: {
    marginTop: 28,
    maxWidth: 280,
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
  },
  controls: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableBtn: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableText: {
    fontFamily: Font.extrabold,
    fontSize: 15,
    color: Palette.ink,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  analyzeFrame: {
    width: 264,
    height: 264,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,197,49,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeRow: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyzeText: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: '#fff',
  },
  analyzeSub: {
    marginTop: 8,
    fontFamily: Font.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
    maxHeight: '82%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(27,23,18,0.15)',
    marginBottom: 16,
  },
  matchPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.greenBg,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  matchText: {
    fontFamily: Font.extrabold,
    fontSize: 12,
    color: Palette.green,
  },
  resultHead: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  resultIcon: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultName: {
    fontFamily: Font.displayExtra,
    fontSize: 21,
    color: Palette.ink,
  },
  resultSub: {
    marginTop: 2,
    fontFamily: Font.regular,
    fontSize: 14,
    color: Palette.textMuted,
  },
  specScroll: {
    marginTop: 16,
  },
  specContent: {
    paddingBottom: 4,
  },
  resultActions: {
    marginTop: 16,
    gap: 10,
  },
  rescan: {
    textAlign: 'center',
    fontFamily: Font.bold,
    fontSize: 14,
    color: Palette.textMuted,
  },
  error: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: Font.medium,
    fontSize: 13,
    color: Palette.red,
  },
});
