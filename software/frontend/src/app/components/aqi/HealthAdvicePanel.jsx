import React from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { getAQICategory, getHealthRecommendations } from '@/app/lib/airQuality';
import { useAiRecommendation } from '@/app/hooks/useAiRecommendation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { cn } from '@/app/lib/utils/cn';

/** Renders `**bold**` spans and blank-line paragraphs from the LLM advice text — no markdown lib needed. */
function AdviceText({ text }) {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, pIdx) => {
        const parts = paragraph.split('**');
        return (
          <p key={pIdx} className="text-sm text-muted leading-relaxed">
            {parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
}

export function HealthAdvicePanel({ aqi, className, title = 'Health guidance' }) {
  const category = getAQICategory(aqi);
  const recommendations = getHealthRecommendations(aqi);
  const { advice, loading: aiLoading, error: aiError } = useAiRecommendation();

  return (
    <Card
      className={cn('overflow-hidden', className)}
      style={{ borderLeftWidth: 4, borderLeftColor: category.color }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="w-5 h-5 text-brand-600" />
          {title}
          {advice && !aiError && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-muted">
              <Sparkles className="w-3.5 h-3.5" />
              AI-generated
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {aiLoading ? (
          <div className="py-2 text-sm text-muted animate-pulse">Generating advice…</div>
        ) : advice && !aiError ? (
          <AdviceText text={advice} />
        ) : (
          <ul className="space-y-2.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted leading-relaxed">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {rec}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
