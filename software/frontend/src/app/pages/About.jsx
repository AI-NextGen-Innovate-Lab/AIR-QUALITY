import React from 'react';
import { Mail, Phone, Globe, AtSign, Radio, Cpu, HeartPulse } from 'lucide-react';
import { DashboardPage } from '@/app/components/layout/DashboardPage';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

const HIGHLIGHTS = [
  {
    Icon: Radio,
    title: 'Live sensor network',
    body: 'Low-cost air quality sensors deployed across Dar es Salaam stream PM2.5, PM10, and gas readings in real time.',
  },
  {
    Icon: Cpu,
    title: 'AI-driven forecasting',
    body: 'Machine learning models trained on the sensor history produce 6-hour AQI, PM2.5, and PM10 forecasts per location.',
  },
  {
    Icon: HeartPulse,
    title: 'Practical health guidance',
    body: 'Group-specific guidance and AI-generated recommendations translate raw readings into what to actually do.',
  },
];

const CONTACT_LINKS = [
  { Icon: Phone, label: '0767 598 691', href: 'tel:+255767598691' },
  { Icon: Mail, label: 'godfrey.luwemba@aru.ac.tz', href: 'mailto:godfrey.luwemba@aru.ac.tz' },
  { Icon: Globe, label: 'csm.aru.ac.tz', href: 'https://csm.aru.ac.tz/' },
  { Icon: AtSign, label: '@aru_ai_lab', href: 'https://instagram.com/aru_ai_lab' },
];

export default function About() {
  return (
    <DashboardPage narrow>
      <PageHeader
        badge="About"
        title="About AirQuality DSM"
        description="A real-time air quality monitoring and AI health-guidance platform for Dar es Salaam, built by the ARU AI Lab."
      />

      <p className="mb-8 text-muted leading-relaxed">
        AirQuality DSM combines a live sensor network with machine learning to help residents,
        students, and researchers understand and plan around local air quality. Readings are
        collected continuously, fed into forecasting models, and turned into plain-language
        guidance for the general public and specific groups who are more sensitive to pollution.
      </p>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((highlight) => (
          <Card key={highlight.title} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <highlight.Icon className="h-5 w-5 text-brand-600" />
                {highlight.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted leading-relaxed">{highlight.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Get in touch</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {CONTACT_LINKS.map((contact) => (
              <a
                key={contact.label}
                href={contact.href}
                target={contact.href.startsWith('http') ? '_blank' : undefined}
                rel={contact.href.startsWith('http') ? 'noreferrer' : undefined}
                className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm text-muted hover:text-brand-700 hover:border-brand-200 transition-colors"
              >
                <contact.Icon className="h-4 w-4 shrink-0" />
                {contact.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
