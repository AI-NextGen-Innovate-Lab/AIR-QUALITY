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
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl pointer-events-none pulse-glow" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-50 blur-2xl pointer-events-none pulse-soft" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-3xl">
          {backgroundImageAlt ? (
            <span className="sr-only">{backgroundImageAlt}</span>
          ) : null}
          <p className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-brand-700 uppercase tracking-widest">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-aqi-good opacity-75 pulse-ring" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-aqi-good" />
            </span>
            Live monitoring
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-xl sm:text-2xl text-muted max-w-2xl leading-relaxed">{subtitle}</p>
          )}
          {meta && (
            <div className="mt-5 text-base sm:text-lg text-muted-foreground">{meta}</div>
          )}
        </div>

        <Card className="mt-10 max-w-2xl border-border/80 shadow-[var(--shadow-card-hover)] card-interactive animate-fade-in-up animate-delay-200">
          <CardContent className="pt-8 pb-8 sm:pt-10 sm:pb-10">
            <p className="text-sm sm:text-base font-semibold uppercase tracking-wider text-muted text-center mb-6">
              Air Quality Index (US EPA)
            </p>

            {loading ? (
              <div className="py-14 text-center text-lg text-muted pulse-soft">
                Loading latest readings…
              </div>
            ) : error ? (
              <p className="py-10 text-center text-aqi-unhealthy text-base sm:text-lg">{error}</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
                <AqiValue value={aqi} size="lg" pulse />
                <div className="flex-1 w-full space-y-4 min-w-0">
                  <p className="text-base sm:text-lg text-muted leading-relaxed text-center sm:text-left">
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
