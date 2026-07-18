import React from 'react';
import { cn } from '@/app/lib/utils/cn';
import { Card, CardContent } from '@/app/components/ui/card';

export function InsightCard({
  title,
  subtitle,
  image,
  imageAlt,
  children,
  className,
  imagePosition = 'top',
}) {
  const imageBlock = image ? (
    <div
      className={cn(
        'relative overflow-hidden bg-surface',
        imagePosition === 'left' && 'sm:w-2/5 shrink-0',
        imagePosition === 'top' && 'aspect-[16/10] sm:aspect-[2/1]'
      )}
    >
      <img
        src={image}
        alt={imageAlt || title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none"
        aria-hidden
      />
    </div>
  ) : null;

  return (
    <Card className={cn('overflow-hidden h-full flex flex-col', className)}>
      {imagePosition === 'top' && imageBlock}
      <div
        className={cn(
          'flex flex-1 flex-col',
          imagePosition === 'left' && 'sm:flex-row'
        )}
      >
        {imagePosition === 'left' && imageBlock}
        <CardContent className={cn('flex flex-1 flex-col py-5 sm:py-6', image && 'min-w-0')}>
          {subtitle && (
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1">
              {subtitle}
            </p>
          )}
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <div className="mt-3 space-y-3 text-sm text-muted leading-relaxed flex-1">
            {children}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export function InsightLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-foreground mb-0.5">
      {children}
    </p>
  );
}
