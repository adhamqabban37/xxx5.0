'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero3D() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const router = useRouter();

  // Fast URL normalization function
  const normalize = (u: string): string => {
    let v = u.trim();
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    return v;
  };

  // Prefetch the summary page for instant navigation
  useEffect(() => {
    router.prefetch('/aeo/summary');
  }, [router]);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) return;

    const normalizedUrl = normalize(websiteUrl);
    startTransition(() => {
      router.push(`/aeo/summary?url=${encodeURIComponent(normalizedUrl)}`);
    });
  };

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      if (mediaQuery.matches) {
        // Disable animations for users who prefer reduced motion
        x.set(0);
        y.set(0);
      }
    };

    handleChange(); // Initial check
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [x, y]);

  return (
    <section className="relative z-10 min-h-[70vh] flex items-center py-20 px-6">
      <div className="max-w-4xl mx-auto text-center w-full">
        <motion.div
          ref={ref}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(20px)',
                }}
              >
                <Image
                  src="/assets/logo.png"
                  alt="XenlixAI logo"
                  width={160}
                  height={160}
                  priority
                  sizes="160px"
                  className="drop-shadow-xl"
                />
              </motion.div>

              {/* Glow effect behind logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl scale-150 -z-10" />
            </div>
          </motion.div>

          {/* SEO Coming Soon Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-4 flex justify-center"
          >
            <div className="bg-gray-500/20 backdrop-blur-sm border border-gray-400/30 rounded-full px-4 py-2 text-sm text-gray-300">
              SEO — Coming Soon
            </div>
          </motion.div>

          {/* Headlines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              transformStyle: 'preserve-3d',
              transform: 'translateZ(10px)',
            }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              Dominate AI Answer Engines
            </h1>
            <p className="text-lg md:text-xl text-blue-300 mb-6 font-medium">
              Answer Engine Optimization (AEO) for ChatGPT, Claude, Perplexity, and Google AI
            </p>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              <span className="text-blue-400 font-semibold">Free AEO Preview</span> reveals how AI
              engines see your business and unlocks your optimization roadmap.
            </p>
          </motion.div>

          {/* Problem highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              transformStyle: 'preserve-3d',
              transform: 'translateZ(5px)',
            }}
            className="bg-amber-600/20 border border-amber-500 rounded-lg p-4 mb-8 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg
                className="w-6 h-6 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-amber-400 font-semibold">Missing from AI Engines?</span>
            </div>
            <p className="text-gray-300 text-sm">
              <strong className="text-white">87% of websites</strong> aren't optimized for AI search
              engines and are losing customers daily
            </p>
          </motion.div>

          {/* AEO Scan Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{
              transformStyle: 'preserve-3d',
              transform: 'translateZ(15px)',
            }}
            className="max-w-2xl mx-auto"
          >
            <form
              action="/aeo/summary"
              method="GET"
              onSubmit={handleSubmit}
              noValidate
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="url"
                  name="url"
                  placeholder="Enter Your Website URL (e.g. yourbusiness.com)"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  required
                  className="flex-1 px-6 py-4 text-lg rounded-lg border-2 border-blue-400/30 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-200"
                  suppressHydrationWarning={true}
                />
                <button
                  type="submit"
                  disabled={!websiteUrl.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-lg shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[200px] flex items-center justify-center"
                  suppressHydrationWarning={true}
                >
                  🤖 Run AEO Preview
                </button>
              </div>
            </form>

            {/* Secondary CTA */}
            <div className="mt-6 text-center">
              <Link
                href="/plans"
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-lg font-medium underline underline-offset-4"
              >
                Get Full AEO Report
              </Link>
            </div>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            <p className="text-gray-400 mt-4">
              ✅ Instant AEO analysis • ✅ Reveals optimization opportunities • ✅ No credit card
              required • ✅ Takes 60 seconds
            </p>

            <div className="mt-8 flex items-center justify-center gap-8 text-gray-400">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1,200+</div>
                <div className="text-sm">Issues Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">150%</div>
                <div className="text-sm">Avg Traffic Increase</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">14 Days</div>
                <div className="text-sm">To See Results</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
