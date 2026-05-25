import React from 'react';
import { Heart } from 'lucide-react';
import { getAQICategory, getHealthRecommendations } from '@/app/lib/airQuality';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { cn } from '@/app/lib/utils/cn';

export function HealthAdvicePanel({ aqi, className, title = 'Health guidance' }) {
  const category = getAQICategory(aqi);
  const recommendations = getHealthRecommendations(aqi);

  return (
    <Card
      className={cn('overflow-hidden card-interactive animate-fade-in-up', className)}
      style={{ borderLeftWidth: 4, borderLeftColor: category.color }}
    >
      <CardHeader className="pb-2 pt-6 sm:pt-8">
        <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
          <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-brand-600 pulse-soft" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-6 sm:pb-8">
        <ul className="space-y-4">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex gap-4 text-base sm:text-lg text-muted leading-relaxed">
              <span
                className="mt-2.5 h-2 w-2 shrink-0 rounded-full pulse-soft"
                style={{ backgroundColor: category.color }}
              />
              {rec}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
