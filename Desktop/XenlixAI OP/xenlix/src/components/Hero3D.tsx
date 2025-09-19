"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Hero3D() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

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

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
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
            transformStyle: "preserve-3d",
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
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
                  ease: "easeInOut",
                }}
                style={{
                  transformStyle: "preserve-3d",
                  transform: "translateZ(20px)",
                }}
              >
                <Image
                  src="/xenlix-logo.png"
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

          {/* Headlines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(10px)",
            }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Get Found in AI Search
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              <span className="text-blue-400 font-semibold">Free AEO Audit</span> reveals why your website isn't showing up in ChatGPT, Claude, Perplexity and AI search engines.
            </p>
          </motion.div>

          {/* Problem highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(5px)",
            }}
            className="bg-amber-600/20 border border-amber-500 rounded-lg p-4 mb-8 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-amber-400 font-semibold">Missing from AI Engines?</span>
            </div>
            <p className="text-gray-300 text-sm">
              <strong className="text-white">87% of websites</strong> aren't optimized for AI search engines and are losing customers daily
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(15px)",
            }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/aeo-scan"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-lg shadow-xl hover:shadow-2xl hover:scale-105"
            >
              🤖 Run Free AI Audit
            </Link>
            <Link
              href="/plans"
              className="border border-blue-400 text-blue-400 font-bold py-4 px-8 rounded-lg hover:bg-blue-400 hover:text-white transition-all duration-200 text-lg hover:scale-105"
            >
              View Pricing
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            <p className="text-gray-400 mt-4">
              ✅ Free AEO scan • ✅ Reveals weak points • ✅ No credit card required • ✅ Takes 60 seconds
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