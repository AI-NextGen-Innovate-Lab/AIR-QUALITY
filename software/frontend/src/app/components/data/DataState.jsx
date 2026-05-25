import React from 'react';
import { AlertCircle, Radio } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { cn } from '@/app/lib/utils/cn';

export function LoadingBlock({ message = 'Loading…', className }) {
  return (
    <div className={cn('py-16 text-center text-muted animate-pulse', className)}>
      {message}
    </div>
  );
}

export function ErrorBlock({ message, className }) {
  return (
    <Card className={cn('border-aqi-unhealthy/30 bg-aqi-unhealthy-soft/30', className)}>
      <CardContent className="py-8 flex items-center justify-center gap-3 text-aqi-unhealthy">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </CardContent>
    </Card>
  );
}

export function EmptyBlock({
  title = 'No data yet',
  description,
  className,
}) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="py-14 text-center">
        <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted mt-2 max-w-md mx-auto">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
