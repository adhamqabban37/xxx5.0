import Link from 'next/link';
import { NAPDisplay } from './NAPDisplay';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                  XenlixAI
                </div>
              </Link>
              <p className="text-gray-300 mb-6 max-w-md">
                AI-powered marketing & website automation platform. XenlixAI helps businesses scale
                with AI-driven ad creation, website optimization, SEO automation, and analytics
                dashboards.
              </p>

              {/* NAP Display - Compact Footer Version */}
              <div className="mb-6">
                <NAPDisplay variant="footer" />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ai-website-builder"
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    AI Website Builder
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ai-seo-automation"
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    SEO Automation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/plans"
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/tools"
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    AI Tools
                  </Link>
                </li>
                <li>
                  <Link
                    href="/seo-analyzer"
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    SEO Analyzer
                  </Link>
                </li>
                <li>
                  <Link
                    href="/schema-generator"
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    Schema Generator
                  </Link>
                </li>
                <li>
                  <Link
                    href="/calculators"
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    ROI Calculators
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guidance"
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    Expert Guidance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} XenlixAI LLC. All rights reserved.
            </div>

            {/* Social Links & Legal */}
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <div className="flex space-x-4">
                <a
                  href="https://x.com/xenlixai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                  aria-label="Follow us on X (Twitter)"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/xenlixai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                  aria-label="Follow us on LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>

              <div className="flex space-x-4 text-sm">
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
