import { Cloud, GitBranch, Mail } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface-elevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-foreground">
                AirQuality DSM
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Real-time air quality monitoring across Dar es Salaam — open data
              for public health and research.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Explore</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link to="/" className="hover:text-brand-700 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/map"
                  className="hover:text-brand-700 transition-colors"
                >
                  Air quality map
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link
                  to="/api-docs"
                  className="hover:text-brand-700 transition-colors"
                >
                  API documentation
                </Link>
              </li>
              <li>
                <Link
                  to="/download"
                  className="hover:text-brand-700 transition-colors"
                >
                  Data download
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-muted-foreground" />
                <a
                  href="mailto:info@airquality.dsm.tz"
                  className="hover:text-brand-700 transition-colors"
                >
                  info@airquality.dsm.tz
                </a>
              </li>
              <li>Dar es Salaam, Tanzania</li>
            </ul>
            <div className="flex gap-2 mt-4">
              <a
                href="mailto:info@airquality.dsm.tz"
                className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center hover:border-brand-500/50 hover:bg-brand-50 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-muted" />
              </a>
              <a
                href="https://github.com"
                className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center hover:border-brand-500/50 hover:bg-brand-50 transition-colors"
                aria-label="Source code"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitBranch className="w-4 h-4 text-muted" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border text-center text-sm text-muted">
          <p>© {year} AirQuality DSM. All rights reserved.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            AQI values use the US EPA scale (PM₂.₅ / PM₁₀).
          </p>
        </div>
      </div>
    </footer>
  );
}
