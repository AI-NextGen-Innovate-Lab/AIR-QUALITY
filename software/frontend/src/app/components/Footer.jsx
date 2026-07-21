import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Globe, AtSign } from 'lucide-react';
import logo from '@/assets/logo.jpg';

const EXPLORE_LINKS = [
  { to: '/', label: 'Overview' },
  { to: '/map', label: 'Live Map' },
  { to: '/health-guidance', label: 'Health Guidance' },
  { to: '/predictions', label: 'Predictions' },
  { to: '/about', label: 'About' },
];

const CONTACT_LINKS = [
  { Icon: Phone, label: '0767 598 691', href: 'tel:+255767598691' },
  { Icon: Mail, label: 'godfrey.luwemba@aru.ac.tz', href: 'mailto:godfrey.luwemba@aru.ac.tz' },
  { Icon: Globe, label: 'csm.aru.ac.tz', href: 'https://csm.aru.ac.tz/' },
  { Icon: AtSign, label: '@aru_ai_lab', href: 'https://instagram.com/aru_ai_lab' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto shrink-0 border-t border-border bg-surface-elevated">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-border" />
              <div>
                <p className="font-semibold text-foreground">AirQuality DSM</p>
                <p className="text-xs text-muted">Environmental intelligence</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted leading-relaxed">
              Real-time air quality monitoring and AI-powered health guidance for Dar es Salaam,
              built by the ARU AI Lab.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explore</p>
            <ul className="space-y-2">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted hover:text-brand-700 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
            <ul className="space-y-2.5">
              {CONTACT_LINKS.map((contact) => (
                <li key={contact.label}>
                  <a
                    href={contact.href}
                    target={contact.href.startsWith('http') ? '_blank' : undefined}
                    rel={contact.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="inline-flex items-center gap-2 text-sm text-muted hover:text-brand-700 transition-colors"
                  >
                    <contact.Icon className="h-3.5 w-3.5 shrink-0" />
                    {contact.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted">© {year} AirQuality DSM · ARU AI Lab</p>
          <p className="text-xs text-muted">AQI values use the US EPA scale (PM₂.₅ / PM₁₀)</p>
        </div>
      </div>
    </footer>
  );
}
