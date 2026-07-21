import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { useAiRecommendation } from '@/app/hooks/useAiRecommendation';
import { getAQICategory } from '@/app/lib/airQuality';
import { HEALTH_GROUPS } from '@/app/lib/healthGroups';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AdviceText } from '@/app/components/aqi/AdviceText';
import { LoadingBlock, ErrorBlock } from '@/app/components/data/DataState';

export default function HealthGuidance() {
  const { advice, aqi, aqiCategory, loading, error } = useAiRecommendation();
  const category = getAQICategory(aqi ?? 0);

  return (
    <DashboardPage>
      <PageHeader
        badge="Health"
        title="Health guidance"
        description="Guidance tailored to today's air quality, broken down by group, plus an AI-generated summary."
      />

      {!loading && aqi != null && (
        <div
          className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-5 py-4"
          style={{ borderLeftWidth: 4, borderLeftColor: category.color }}
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold"
            style={{ backgroundColor: category.bgSoft, color: category.color }}
          >
            {Math.round(aqi)}
          </span>
          <div>
            <p className="font-semibold text-foreground">Current air quality: {aqiCategory ?? category.label}</p>
            <p className="text-sm text-muted">Based on the sensor with the highest current AQI in the city.</p>
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HEALTH_GROUPS.map((group) => (
          <Card key={group.key} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <group.Icon className="h-5 w-5 text-brand-600" />
                {group.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted leading-relaxed">{group.guidance(aqi ?? 0)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden" style={{ borderLeftWidth: 4, borderLeftColor: category.color }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="w-5 h-5 text-brand-600" />
            AI recommendation
            {advice && !error && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-muted">
                <Sparkles className="w-3.5 h-3.5" />
                AI-generated
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <LoadingBlock message="Generating advice…" />
          ) : error || !advice ? (
            <ErrorBlock message="AI recommendation unavailable right now — the group guidance above still applies." />
          ) : (
            <AdviceText text={advice} />
          )}
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
