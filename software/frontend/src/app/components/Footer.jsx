import React from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Mail, Phone, ExternalLink, MapPin, Activity, HeartPulse, Home } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white text-gray-800 mt-auto border-t border-gray-200">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8">
           {/* Brand Section */}
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Cloud className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold text-2xl text-gray-900 tracking-tight">AirQuality DSM</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
                Advanced air quality monitoring across Dar es Salaam. Empowering citizens with real-time data to protect public health and the environment.
              </p>
           </div>

           {/* Quick Links */}
           <div>
              <h3 className="text-gray-900 font-bold mb-6 uppercase tracking-wider text-sm">Quick Links</h3>
              <ul className="space-y-4">
                <li>
                  <Link to="/" className="group flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    <div className="p-1.5 rounded-md bg-gray-50 border border-gray-200 group-hover:border-blue-300 transition-colors shadow-sm">
                      <Home className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/map" className="group flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    <div className="p-1.5 rounded-md bg-gray-50 border border-gray-200 group-hover:border-blue-300 transition-colors shadow-sm">
                      <MapPin className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    Map
                  </Link>
                </li>
                <li>
                  <Link to="/prediction" className="group flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    <div className="p-1.5 rounded-md bg-gray-50 border border-gray-200 group-hover:border-blue-300 transition-colors shadow-sm">
                      <Activity className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    Prediction
                  </Link>
                </li>
                <li>
                  <Link to="/health-guide" className="group flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    <div className="p-1.5 rounded-md bg-gray-50 border border-gray-200 group-hover:border-blue-300 transition-colors shadow-sm">
                      <HeartPulse className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    Health Guide
                  </Link>
                </li>
              </ul>
           </div>

           {/* Contact & Affiliation */}
           <div>
              <h3 className="text-gray-900 font-bold mb-6 uppercase tracking-wider text-sm">Contact Us</h3>
              <ul className="space-y-4">
                <li>
                  <a href="mailto:csm@aruweb.ac.tz" className="group flex items-center gap-4 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:border-blue-300 transition-all shadow-sm">
                      <Mail className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                    </div>
                    csm@aruweb.ac.tz
                  </a>
                </li>
                <li>
                  <a href="tel:0767598691" className="group flex items-center gap-4 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:border-blue-300 transition-all shadow-sm">
                      <Phone className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                    </div>
                    0767598691
                  </a>
                </li>
                <li className="pt-4 mt-2">
                  <a href="https://csm.aru.ac.tz/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 group-hover:bg-blue-50">
                      <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="flex flex-col">
                      <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">CSM Portal</span>
                      <span className="text-xs font-medium text-gray-500 group-hover:text-blue-500 transition-colors">csm.aru.ac.tz</span>
                    </span>
                  </a>
                </li>
              </ul>
           </div>
         </div>

         <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-600">
              © {new Date().getFullYear()} AirQuality DSM. All rights reserved.
            </p>
            <div className="flex items-center gap-8 text-sm font-medium text-gray-600">
              <span className="hover:text-blue-600 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-blue-600 cursor-pointer transition-colors">Terms of Service</span>
            </div>
         </div>
       </div>
    </footer>
  );
}
