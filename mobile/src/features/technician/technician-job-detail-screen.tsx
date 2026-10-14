/**
 * Technician job detail — assign (company), schedule, complete, and request a
 * review. View-only shell; logic in `useTechnicianJob`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { Font, Palette } from '@/constants/design';
import { AssignPicker } from '@/features/technician/components/assign-picker';
import { useTechnicianJob } from '@/features/technician/hooks/use-technician-jobs';
import { useTeam } from '@/features/team/hooks/use-team';

/** Tomorrow at midnight — the earliest schedulable day (backend requires future). */
function tomorrow(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

export function TechnicianJobDetailScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { job, isLoading, busy, error, assign, schedule, complete, requestReview } = useTechnicianJob(id);
  const { members, canManageTeam } = useTeam();
  const [date, setDate] = useState<Date | null>(null);

  const onSchedule = () => {
    if (!date) return;
    const at = new Date(date);
    at.setHours(9, 0, 0, 0); // 9:00 AM local, safely after "now"
    schedule(at.toISOString());
  };

  const confirmComplete = () =>
    Alert.alert('Mark job complete?', 'This finishes the job and lets the customer leave a review.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => complete() },
    ]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>Job</Text>
        <View style={styles.iconBtn} />
      </View>

      {isLoading || !job ? (
        <View style={styles.center}>
          {isLoading ? <ActivityIndicator color={Palette.gold} /> : <Text style={styles.muted}>Not found.</Text>}
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
          <Text style={styles.name}>{job.generatorLabel ?? 'Generator maintenance'}</Text>
          <Text style={styles.meta}>
            {job.state}
            {job.customerName ? ` · ${job.customerName}` : ''}
          </Text>

          <View style={styles.card}>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{job.statusLabel}</Text>
            </View>
            {job.acceptedPriceLabel ? <Text style={styles.price}>{job.acceptedPriceLabel}</Text> : null}
            {job.scheduleLabel ? <Text style={styles.muted}>Scheduled {job.scheduleLabel}</Text> : null}
            {job.assignedTechnicianName ? (
              <Text style={styles.muted}>Assigned to {job.assignedTechnicianName}</Text>
            ) : null}
            {job.detail ? <Text style={styles.detail}>{job.detail}</Text> : null}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Company assignment (owner/admin) before scheduling. */}
          {job.needsAssignment && canManageTeam ? (
            <AssignPicker
              members={members}
              assignedId={null}
              busy={busy}
              onAssign={(userId) => assign(userId)}
            />
          ) : null}

          {/* Schedule the visit once assigned. */}
          {job.canSchedule ? (
            <View style={styles.card}>
              <DateField label="Visit date" value={date} onChange={setDate} minimumDate={tomorrow()} />
              <Button label="Schedule visit" onPress={onSchedule} loading={busy} disabled={!date} />
            </View>
          ) : null}

          {/* Complete the job. */}
          {job.canComplete ? (
            <Button label="Mark complete" onPress={confirmComplete} loading={busy} />
          ) : null}

          {/* Review flow once completed. */}
          {job.status === 'completed' ? (
            job.hasReview && job.review ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Customer review</Text>
                <Text style={styles.stars}>{'★'.repeat(job.review.rating)}</Text>
                {job.review.comment ? <Text style={styles.detail}>{job.review.comment}</Text> : null}
              </View>
            ) : (
              <Button label="Request a review" onPress={requestReview} loading={busy} />
            )
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: Font.displayBold, fontSize: 17, color: Palette.ink },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  name: { fontFamily: Font.displayExtra, fontSize: 22, color: Palette.ink },
  meta: { marginTop: -8, fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  card: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Palette.textMuted,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.goldWash,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.planText },
  price: { fontFamily: Font.extrabold, fontSize: 20, color: Palette.ink },
  detail: { fontFamily: Font.regular, fontSize: 14, color: Palette.textStrong, lineHeight: 20 },
  muted: { fontFamily: Font.regular, fontSize: 13.5, color: Palette.textMuted },
  error: { fontFamily: Font.medium, fontSize: 13.5, color: Palette.red },
  stars: { fontSize: 20, color: Palette.gold },
});
