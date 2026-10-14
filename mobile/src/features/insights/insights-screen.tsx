/**
 * Insights — deterministic fleet analytics (health score, weekly run hours,
 * 30-day forecast) plus the cached AI recommendation. The app reads a single
 * `GET /insights`; it never calls Gemini. State/data wiring lives in
 * `useInsights`; this component just composes.
 */

import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Font, Palette } from '@/constants/design';
import { IS_TABLET } from '@/constants/dimensions';
import { HealthRing } from '@/features/insights/components/health-ring';
import { RecommendationCard } from '@/features/insights/components/recommendation-card';
import { RunHoursChart } from '@/features/insights/components/run-hours-chart';
import { useInsights } from '@/features/insights/hooks/use-insights';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';

export function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { analytics, ai, aiPending, isLoading, refresh, requestRefresh, refreshingAi } = useInsights();

  useRefreshOnFocus(refresh);
  const { refreshing, onRefresh } = useRefreshControl(refresh);

  const hasFleet = (analytics?.generatorCount ?? 0) > 0;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Last 30 days · your fleet</Text>
      </View>

      {isLoading && !analytics ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : !hasFleet ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No insights yet</Text>
          <Text style={styles.emptyText}>Add a generator to unlock fleet health and AI recommendations.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Palette.gold}
              colors={[Palette.gold]}
            />
          }>
          {analytics ? (
            <>
              <HealthRing
                score={analytics.healthScore}
                label={analytics.healthLabel}
                subtext={analytics.healthSubtext}
              />
              <RunHoursChart
                bars={analytics.weeklyRunHours}
                trendLabel={analytics.runHoursTrendLabel}
                forecastLabel={analytics.forecastLabel}
              />
            </>
          ) : null}

          <View style={styles.aiHeader}>
            <Text style={styles.section}>Recommendations</Text>
            {ai ? (
              <Pressable onPress={requestRefresh} disabled={refreshingAi} accessibilityRole="button">
                <Text style={styles.refresh}>
                  {refreshingAi ? 'Refreshing…' : ai.generatedAgo ? `Updated ${ai.generatedAgo}` : 'Refresh'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {ai && ai.recommendations.length > 0 ? (
            <View style={styles.recommendations}>
              {ai.recommendations.map((rec, i) => (
                <RecommendationCard key={`${rec.title}-${i}`} recommendation={rec} />
              ))}
            </View>
          ) : aiPending || !ai ? (
            <Card style={styles.pending}>
              <ActivityIndicator color={Palette.gold} />
              <Text style={styles.pendingText}>Analyzing your fleet — your first recommendation is on its way.</Text>
            </Card>
          ) : (
            <Card style={styles.pending}>
              <Text style={styles.pendingText}>No recommendations right now — your fleet looks healthy.</Text>
            </Card>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  header: { paddingHorizontal: wp(IS_TABLET ? 12 : 5), paddingBottom: 6 },
  title: { fontFamily: Font.displayExtra, fontSize: 28, color: Palette.ink },
  subtitle: { marginTop: 2, fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 6, paddingBottom: 80 },
  emptyTitle: { fontFamily: Font.displayBold, fontSize: 18, color: Palette.ink },
  emptyText: { textAlign: 'center', fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  content: { paddingHorizontal: wp(IS_TABLET ? 12 : 5), paddingTop: 10, gap: 16 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  section: { fontFamily: Font.displayBold, fontSize: 16, color: Palette.ink },
  refresh: { fontFamily: Font.bold, fontSize: 13, color: Palette.goldText },
  recommendations: { gap: 12 },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  pendingText: { flex: 1, fontFamily: Font.regular, fontSize: 13.5, lineHeight: 19, color: Palette.textMuted },
});
