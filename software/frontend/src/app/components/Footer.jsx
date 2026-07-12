import { Mail } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto shrink-0 border-t border-border bg-surface-elevated">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:px-6">
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium text-foreground">© {year} AirQuality DSM</p>
          {/* <p className="text-xs text-muted">
            AQI values use the US EPA scale (PM₂.₅ / PM₁₀)
          </p> */}
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted">
          <Link to="/" className="hover:text-brand-700 transition-colors">
            Overview
          </Link>
          <Link to="/map" className="hover:text-brand-700 transition-colors">
            Map
          </Link>
          {/* <Link to="/api-docs" className="hover:text-brand-700 transition-colors">
            API docs
          </Link> */}
          <a
            href="mailto:info@airquality.dsm.tz"
            className="inline-flex items-center gap-1.5 hover:text-brand-700 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
