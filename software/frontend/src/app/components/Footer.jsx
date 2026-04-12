import React from 'react';
import { Cloud, Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">AirQuality DSM</span>
            </div>
            <p className="text-sm text-gray-600">
              Monitoring air quality across Dar es Salaam to protect public health and the environment.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-blue-600">About Us</a></li>
              <li><a href="#" className="hover:text-blue-600">How It Works</a></li>
              <li><a href="#" className="hover:text-blue-600">Our Sensors</a></li>
              <li><a href="#" className="hover:text-blue-600">Partners</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-blue-600">API Documentation</a></li>
              <li><a href="#" className="hover:text-blue-600">Data Download</a></li>
              <li><a href="#" className="hover:text-blue-600">Health Guidelines</a></li>
              <li><a href="#" className="hover:text-blue-600">Research Papers</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:info@airquality.dsm.tz" className="hover:text-blue-600">
                  info@airquality.dsm.tz
                </a>
              </li>
              <li>Dar es Salaam, Tanzania</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
          <p>© 2026 AirQuality DSM. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
            <a href="#" className="hover:text-blue-600">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
