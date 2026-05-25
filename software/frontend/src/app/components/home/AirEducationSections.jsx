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
        variant="display"
        className="pt-4 border-t border-border bg-surface/50"
        title={EDUCATION_INTRO.title}
        description={EDUCATION_INTRO.description}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-16">
        <InsightCard
          title="Where pollution comes from"
          subtitle="Sources"
          image={pollutionSourceImg}
          imageAlt="Industrial stack emitting smoke into a clear sky"
          animationDelay="animate-delay-100"
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
          animationDelay="animate-delay-200"
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
        variant="display"
        title="Main pollutants we measure"
        description="Fine and coarse particles drive our Air Quality Index. Values are shown in micrograms per cubic meter (µg/m³)."
        className="pt-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {POLLUTANT_INSIGHTS.map((p, i) => (
            <Card
              key={p.id}
              className={cn(
                'h-full border-l-4 card-interactive animate-fade-in-up',
                i === 0 ? 'animate-delay-100' : 'animate-delay-200',
                p.accent === 'aqi-unhealthy' && 'border-l-aqi-unhealthy',
                p.accent === 'aqi-moderate' && 'border-l-aqi-moderate'
              )}
            >
              <CardContent className="py-8 sm:py-10">
                <div className="flex flex-wrap items-baseline gap-3 mb-4">
                  <h3 className="text-3xl sm:text-4xl font-bold text-foreground">{p.name}</h3>
                  <span className="text-base sm:text-lg text-muted">({p.shortName})</span>
                  <span className="ml-auto text-sm font-mono text-muted-foreground bg-surface px-3 py-1 rounded-lg border border-border">
                    {p.symbol} · {p.unit}
                  </span>
                </div>
                <div className="space-y-5 text-base sm:text-lg text-muted leading-relaxed">
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
        variant="display"
        title="Weather components on our sensors"
        description="Environmental readings help explain why particle levels rise or fall."
        className="border-t border-border"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WEATHER_INSIGHTS.map((w, i) => {
            const icons = [Sun, Droplets, Droplets, Wind];
            const Icon = icons[i] ?? Wind;
            const delays = ['animate-delay-100', 'animate-delay-200', 'animate-delay-300', 'animate-delay-400'];
            return (
              <Card
                key={w.id}
                className={cn('h-full card-interactive animate-fade-in-up', delays[i])}
              >
                <CardContent className="py-7 sm:py-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 mb-4 pulse-soft">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">{w.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    {w.symbol}
                    {w.unit ? ` · ${w.unit}` : ''}
                  </p>
                  <p className="mt-4 text-base text-muted leading-relaxed">{w.what}</p>
                  <p className="mt-3 text-base text-muted leading-relaxed">
                    <span className="font-semibold text-foreground">Impact: </span>
                    {w.impact}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PageSection>

      <PageSection
        variant="display"
        title="When weather meets air pollution"
        description="Use live PM data together with weather to interpret what you see outdoors."
        className="border-t border-border"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {WEATHER_POLLUTION_LINKS.map((item, i) => (
            <div
              key={item.title}
              className={cn(
                'rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8 shadow-[var(--shadow-card)] card-interactive animate-fade-in-up',
                i % 2 === 0 ? 'animate-delay-100' : 'animate-delay-200'
              )}
            >
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">{item.title}</h3>
              <p className="mt-3 text-base sm:text-lg text-muted leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        variant="display"
        className="border-t border-border pb-4"
        title={AQI_EDUCATION.title}
        description={AQI_EDUCATION.paragraphs[0]}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-8 animate-fade-in-up">
            <p className="text-base sm:text-lg text-muted leading-relaxed">
              {AQI_EDUCATION.paragraphs[1]}
            </p>
            <AqiScaleBar className="max-w-full" size="lg" />
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AQI_EDUCATION.bands.map((b, i) => (
                <li
                  key={b.range}
                  className={cn(
                    'rounded-2xl border border-border bg-surface-elevated px-5 py-4 card-interactive animate-fade-in-up text-base',
                    ['animate-delay-100', 'animate-delay-200', 'animate-delay-300', 'animate-delay-400'][i]
                  )}
                >
                  <span className="text-lg font-bold text-foreground">{b.range}</span>
                  <span className="text-muted"> — {b.label}</span>
                  <p className="text-sm sm:text-base text-muted mt-2 leading-relaxed">{b.note}</p>
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
          <div className="lg:col-span-5 flex justify-center lg:justify-end animate-fade-in-up animate-delay-300">
            <div className="relative w-full max-w-md">
              <div
                className="absolute inset-0 rounded-3xl bg-brand-100/50 blur-3xl pulse-glow"
                aria-hidden
              />
              <img
                src={heroGraphic}
                alt=""
                className="relative w-full h-auto drop-shadow-2xl pulse-soft"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
}
