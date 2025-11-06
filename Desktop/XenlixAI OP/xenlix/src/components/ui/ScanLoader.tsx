'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Zap, Brain, Search, Map, Target, BarChart3 } from 'lucide-react';

interface ScanLoaderProps {
  isVisible: boolean;
  scanType: 'quick' | 'full';
  onComplete?: () => void;
}

const SCAN_MESSAGES = {
  quick: [
    { icon: Search, text: 'Analyzing website structure...', duration: 2000 },
    { icon: Brain, text: 'Extracting business information...', duration: 2500 },
    { icon: Target, text: 'Checking AEO signals...', duration: 2000 },
    { icon: BarChart3, text: 'Generating quick insights...', duration: 1500 },
  ],
  full: [
    { icon: Search, text: 'Loading your free scan data...', duration: 1000 },
    { icon: Zap, text: 'Running PageSpeed Insights...', duration: 3000 },
    { icon: Brain, text: 'Processing YAML rules engine...', duration: 2500 },
    { icon: Map, text: 'Geocoding business location...', duration: 2000 },
    { icon: Target, text: 'Finding local competitors...', duration: 3000 },
    { icon: BarChart3, text: 'Generating comprehensive analysis...', duration: 2000 },
    { icon: Zap, text: 'Unlocking premium features...', duration: 1500 },
  ],
};

export default function ScanLoader({ isVisible, scanType, onComplete }: ScanLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const messages = SCAN_MESSAGES[scanType];
  const totalDuration = messages.reduce((sum, msg) => sum + msg.duration, 0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0);
      setProgress(0);
      return;
    }

    let accumulatedTime = 0;
    let currentTimeout: NodeJS.Timeout;

    const runMessages = () => {
      messages.forEach((message, index) => {
        const delay = accumulatedTime;
        accumulatedTime += message.duration;

        setTimeout(() => {
          if (isVisible) {
            setCurrentMessageIndex(index);

            // Update progress
            const progressPercent = ((accumulatedTime - message.duration) / totalDuration) * 100;
            setProgress(progressPercent);
          }
        }, delay);
      });

      // Complete the scan
      currentTimeout = setTimeout(() => {
        if (isVisible) {
          setProgress(100);
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }
      }, totalDuration);
    };

    runMessages();

    return () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, [isVisible, scanType, messages, totalDuration, onComplete]);

  if (!isVisible) return null;

  const CurrentIcon = messages[currentMessageIndex]?.icon || Loader2;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-blue-900/90 to-purple-900/90 border border-blue-400/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {scanType === 'quick' ? '⚡ Quick Scan' : '🚀 Comprehensive Scan'}
          </h2>
          <p className="text-blue-200">
            {scanType === 'quick'
              ? 'Analyzing your website for key insights...'
              : 'Running full premium analysis with all integrations...'}
          </p>
        </div>

        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-blue-500/20 rounded-full p-6 border border-blue-400/30">
              <CurrentIcon className="w-16 h-16 text-blue-400 animate-spin" />
            </div>
            {/* Pulse effect */}
            <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Current Message */}
        <div className="text-center mb-6">
          <p className="text-white font-medium text-lg">
            {messages[currentMessageIndex]?.text || 'Processing...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Progress Text */}
        <div className="text-center">
          <p className="text-blue-200 text-sm">
            {Math.round(progress)}% Complete • Step {currentMessageIndex + 1} of {messages.length}
          </p>
        </div>

        {/* Scan Type Indicator */}
        <div className="mt-6 flex justify-center">
          <div
            className={`px-4 py-2 rounded-full border ${
              scanType === 'quick'
                ? 'bg-green-500/20 border-green-400/50 text-green-300'
                : 'bg-purple-500/20 border-purple-400/50 text-purple-300'
            }`}
          >
            <span className="text-sm font-semibold">
              {scanType === 'quick' ? 'FREE SCAN' : 'PREMIUM SCAN'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
