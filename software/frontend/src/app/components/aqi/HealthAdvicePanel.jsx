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
      className={cn('overflow-hidden', className)}
      style={{ borderLeftWidth: 4, borderLeftColor: category.color }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="w-5 h-5 text-brand-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
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
      </CardContent>
    </Card>
  );
}
