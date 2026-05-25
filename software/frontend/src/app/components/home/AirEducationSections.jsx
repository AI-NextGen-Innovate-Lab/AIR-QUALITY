import React from 'react';
import { Link } from 'react-router-dom';
import { Wind, Droplets, Sun, ArrowRight } from 'lucide-react';
import { PageSection } from '@/app/components/layout/PageSection';
import { InsightCard, InsightLabel } from '@/app/components/home/InsightCard';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AqiScaleBar } from '@/app/components/aqi/AqiScaleBar';
import {
  EDUCATION_INTRO,
  POLLUTANT_INSIGHTS,
  WEATHER_INSIGHTS,
  WEATHER_POLLUTION_LINKS,
  AQI_EDUCATION,
} from '@/app/lib/airEducation';
import { cn } from '@/app/lib/utils/cn';

import heroGraphic from '@/assets/hero.png';
import pollutionSourceImg from '@/assets/pawel-czerwinski-WZ7vr3YcQrg-unsplash.jpg';
import airCompositionImg from '@/assets/matthias-heyde-aBGYL-ue5xo-unsplash.jpg';

export function AirEducationSections() {
  return (
    <>
      <PageSection
        className="pt-4 border-t border-border bg-surface/50"
        title={EDUCATION_INTRO.title}
        description={EDUCATION_INTRO.description}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-14">
        <InsightCard
          title="Where pollution comes from"
          subtitle="Sources"
          image={pollutionSourceImg}
          imageAlt="Industrial stack emitting smoke into a clear sky"
        >
          <p>
            Dar es Salaam&apos;s air mixes traffic emissions, road dust, charcoal and
            waste burning, construction, and industrial plumes. Fine particles (PM₂.₅)
            often dominate health risk near busy corridors.
          </p>
          <InsightLabel>Why we monitor continuously</InsightLabel>
          <p>
            Levels change by hour, weather, and neighborhood. Open data helps residents,
            schools, and planners see real conditions—not only annual averages.
          </p>
        </InsightCard>

        <InsightCard
          title="What’s in the air"
          subtitle="Composition"
          image={airCompositionImg}
          imageAlt="CO2 text formed from clouds in a blue sky"
        >
          <p>
            Alongside particles, sensors can report temperature, humidity, and pressure—
            the same weather variables that influence how pollution builds up or clears.
          </p>
          <InsightLabel>Greenhouse gases vs. particles</InsightLabel>
          <p>
            CO₂ is a major climate gas; our stations focus on{' '}
            <strong className="text-foreground font-medium">particulate matter</strong>{' '}
            for health-related AQI because those concentrations change quickly at
            street level where people live and work.
          </p>
        </InsightCard>
      </div>

      <PageSection
        title="Main pollutants we measure"
        description="Fine and coarse particles drive our Air Quality Index. Values are shown in micrograms per cubic meter (µg/m³)."
        className="pt-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {POLLUTANT_INSIGHTS.map((p) => (
            <Card
              key={p.id}
              className={cn(
                'h-full border-l-4',
                p.accent === 'aqi-unhealthy' && 'border-l-aqi-unhealthy',
                p.accent === 'aqi-moderate' && 'border-l-aqi-moderate'
              )}
            >
              <CardContent className="py-6">
                <div className="flex flex-wrap items-baseline gap-2 mb-3">
                  <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                  <span className="text-sm text-muted">({p.shortName})</span>
                  <span className="ml-auto text-xs font-mono text-muted-foreground bg-surface px-2 py-0.5 rounded-lg border border-border">
                    {p.symbol} · {p.unit}
                  </span>
                </div>
                <div className="space-y-4 text-sm text-muted leading-relaxed">
                  <div>
                    <InsightLabel>What it is</InsightLabel>
                    <p>{p.what}</p>
                  </div>
                  <div>
                    <InsightLabel>Health impacts</InsightLabel>
                    <p>{p.health}</p>
                  </div>
                  <div>
                    <InsightLabel>Practical tips</InsightLabel>
                    <p>{p.actions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Weather components on our sensors"
        description="Environmental readings help explain why particle levels rise or fall."
        className="border-t border-border"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WEATHER_INSIGHTS.map((w, i) => {
            const icons = [Sun, Droplets, Droplets, Wind];
            const Icon = icons[i] ?? Wind;
            return (
              <Card key={w.id} className="h-full">
                <CardContent className="py-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">{w.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {w.symbol}
                    {w.unit ? ` · ${w.unit}` : ''}
                  </p>
                  <p className="mt-3 text-sm text-muted leading-relaxed">{w.what}</p>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    <span className="font-medium text-foreground">Impact: </span>
                    {w.impact}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PageSection>

      <PageSection
        title="When weather meets air pollution"
        description="Use live PM data together with weather to interpret what you see outdoors."
        className="border-t border-border"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WEATHER_POLLUTION_LINKS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-card)]"
            >
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        className="border-t border-border pb-4"
        title={AQI_EDUCATION.title}
        description={AQI_EDUCATION.paragraphs[0]}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-sm text-muted leading-relaxed">
              {AQI_EDUCATION.paragraphs[1]}
            </p>
            <AqiScaleBar className="max-w-full" />
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AQI_EDUCATION.bands.map((b) => (
                <li
                  key={b.range}
                  className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-foreground">{b.range}</span>
                  <span className="text-muted"> — {b.label}</span>
                  <p className="text-xs text-muted mt-1">{b.note}</p>
                </li>
              ))}
            </ul>
            <Link to="/map" className="inline-flex">
              <Button type="button" variant="secondary">
                View live AQI on the map
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 rounded-3xl bg-brand-100/40 blur-2xl" aria-hidden />
              <img
                src={heroGraphic}
                alt=""
                className="relative w-full h-auto drop-shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
}
