import React from 'react';
import { getAQICategory } from '@/app/lib/airQuality';
import { cn } from '@/app/lib/utils/cn';
import { Card, CardContent } from '@/app/components/ui/card';
import { AqiValue } from './AqiValue';
import { PollutantRow } from './PollutantRow';

export function AqiHero({
  title,
  subtitle,
  aqi,
  dominantPollutant,
  pm25,
  pm10,
  loading,
  error,
  meta,
  className,
  backgroundImage,
  backgroundImageAlt = '',
}) {
  const category = getAQICategory(aqi);

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border bg-surface-elevated',
        className
      )}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-50/95 via-surface-elevated/90 to-surface pointer-events-none"
        aria-hidden
      />
      {backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.18] pointer-events-none"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-surface-elevated via-surface-elevated/85 to-transparent pointer-events-none"
            aria-hidden
          />
        </>
      )}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-50 blur-2xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-3xl">
          {backgroundImageAlt ? (
            <span className="sr-only">{backgroundImageAlt}</span>
          ) : null}
          <p className="text-sm font-medium text-brand-700 uppercase tracking-wide">
            Live monitoring
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-lg text-muted max-w-2xl">{subtitle}</p>
          )}
          {meta && <div className="mt-4 text-sm text-muted-foreground">{meta}</div>}
        </div>

        <Card className="mt-8 max-w-xl border-border/80 shadow-[var(--shadow-card-hover)]">
          <CardContent className="pt-6 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted text-center mb-4">
              Air Quality Index (US EPA)
            </p>

            {loading ? (
              <div className="py-12 text-center text-muted animate-pulse">
                Loading latest readings…
              </div>
            ) : error ? (
              <p className="py-8 text-center text-aqi-unhealthy text-sm">{error}</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-10">
                <AqiValue value={aqi} size="lg" />
                <div className="flex-1 w-full space-y-3 min-w-0">
                  <p className="text-sm text-muted leading-relaxed text-center sm:text-left">
                    {category.description}
                  </p>
                  <div className="rounded-xl bg-surface border border-border p-4 space-y-2">
                    <PollutantRow
                      label="Main pollutant"
                      value={dominantPollutant ?? '—'}
                    />
                    <PollutantRow
                      label="PM₂.₅"
                      value={pm25}
                      unit="µg/m³"
                    />
                    <PollutantRow
                      label="PM₁₀"
                      value={pm10}
                      unit="µg/m³"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
