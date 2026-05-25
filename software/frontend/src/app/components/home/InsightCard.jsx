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
  animationDelay = '',
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
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent pointer-events-none transition-opacity duration-500 group-hover:from-black/45"
        aria-hidden
      />
    </div>
  ) : null;

  return (
    <Card
      className={cn(
        'group overflow-hidden h-full flex flex-col card-interactive animate-fade-in-up',
        animationDelay,
        className
      )}
    >
      {imagePosition === 'top' && imageBlock}
      <div
        className={cn(
          'flex flex-1 flex-col',
          imagePosition === 'left' && 'sm:flex-row'
        )}
      >
        {imagePosition === 'left' && imageBlock}
        <CardContent
          className={cn('flex flex-1 flex-col py-6 sm:py-8', image && 'min-w-0')}
        >
          {subtitle && (
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-700 mb-2">
              {subtitle}
            </p>
          )}
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
            {title}
          </h3>
          <div className="mt-4 space-y-4 text-base sm:text-lg text-muted leading-relaxed flex-1">
            {children}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export function InsightLabel({ children }) {
  return (
    <p className="text-sm sm:text-base font-semibold uppercase tracking-wide text-foreground mb-1">
      {children}
    </p>
  );
}
