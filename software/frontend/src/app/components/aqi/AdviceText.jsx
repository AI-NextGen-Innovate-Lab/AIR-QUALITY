import React from 'react';
import { Activity, Users, Shield, Ban, TrendingUp, Info } from 'lucide-react';

const ICON_RULES = [
  { match: /health effect/i, Icon: Activity },
  { match: /most at risk|who is/i, Icon: Users },
  { match: /protective action/i, Icon: Shield },
  { match: /avoid/i, Icon: Ban },
  { match: /forecast/i, Icon: TrendingUp },
];

function iconFor(heading) {
  const rule = ICON_RULES.find((r) => r.match.test(heading || ''));
  return rule ? rule.Icon : Info;
}

/** Splits `**Heading**\nBody` LLM advice text into {heading, body} sections — no markdown lib needed. */
function parseSections(text) {
  return text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const match = paragraph.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
      return match ? { heading: match[1].trim(), body: match[2].trim() } : { heading: null, body: paragraph };
    });
}

/** Renders LLM advice text as one card per section (heading + body). */
export function AdviceText({ text }) {
  const sections = parseSections(text);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sections.map((section, i) => {
        const Icon = iconFor(section.heading);
        return (
          <div key={i} className="rounded-xl border border-border bg-surface p-4">
            {section.heading && (
              <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon className="h-4 w-4 shrink-0 text-brand-600" />
                {section.heading}
              </p>
            )}
            <p className="text-sm text-muted leading-relaxed">{section.body}</p>
          </div>
        );
      })}
    </div>
  );
}
