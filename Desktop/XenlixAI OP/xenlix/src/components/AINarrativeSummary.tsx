import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface ScoreData {
  questionIntentScore: number;
  answerReadinessScore: number;
  conversationalToneScore: number;
  overallAeoScore: number;
  technicalSeoScore?: number;
  readabilityScore?: number;
  sentimentScore?: number;
}

interface AINarrativeSummaryProps {
  scores: ScoreData;
  businessName?: string;
}

function generateNarrativeSummary(scores: ScoreData, businessName: string = "your site"): string {
  const {
    questionIntentScore,
    answerReadinessScore,
    conversationalToneScore,
    overallAeoScore,
    technicalSeoScore = 0,
    readabilityScore = 0,
    sentimentScore = 0
  } = scores;

  // Identify strengths and weaknesses
  const scoreAnalysis = [
    { name: "Question Intent", score: questionIntentScore, category: "AEO Core" },
    { name: "Answer Readiness", score: answerReadinessScore, category: "AEO Core" },
    { name: "Conversational Tone", score: conversationalToneScore, category: "AEO Core" },
    { name: "Technical SEO", score: technicalSeoScore, category: "Foundation" },
    { name: "Content Readability", score: readabilityScore, category: "Content" },
    { name: "Content Sentiment", score: sentimentScore, category: "Content" }
  ].filter(item => item.score > 0);

  const strengths = scoreAnalysis.filter(item => item.score >= 70);
  const weaknesses = scoreAnalysis.filter(item => item.score < 50);
  const moderate = scoreAnalysis.filter(item => item.score >= 50 && item.score < 70);

  // Determine overall performance level
  let performanceLevel = "";
  let primaryIssue = "";
  let recommendation = "";

  if (overallAeoScore >= 80) {
    performanceLevel = "excellent AEO readiness";
  } else if (overallAeoScore >= 60) {
    performanceLevel = "solid foundation with room for improvement";
  } else if (overallAeoScore >= 40) {
    performanceLevel = "moderate AEO readiness";
  } else {
    performanceLevel = "significant optimization opportunities";
  }

  // Identify primary issue
  if (questionIntentScore < 40) {
    primaryIssue = "content doesn't effectively target question-based searches";
    recommendation = "Focus on creating FAQ-style content and answering direct user questions.";
  } else if (answerReadinessScore < 40) {
    primaryIssue = "content lacks clear, direct answers";
    recommendation = "Restructure content to provide immediate, actionable answers to user queries.";
  } else if (conversationalToneScore < 40) {
    primaryIssue = "content tone is too formal for AI search engines";
    recommendation = "Adopt a more conversational, natural tone that AI engines prefer.";
  } else if (technicalSeoScore < 50) {
    primaryIssue = "technical foundation needs strengthening";
    recommendation = "Address technical SEO issues like meta descriptions, heading structure, and page speed.";
  } else {
    primaryIssue = "balanced improvements needed across all areas";
    recommendation = "Continue optimizing all AEO factors for maximum AI search visibility.";
  }

  // Generate contextual narrative
  let narrative = "";

  if (overallAeoScore >= 70) {
    narrative = `${businessName} demonstrates ${performanceLevel}, positioning well for AI-powered search engines like Google SGE and Perplexity. `;
  } else {
    narrative = `Based on our analysis, ${businessName} shows ${performanceLevel}. `;
  }

  if (weaknesses.length > 0) {
    const primaryWeakness = weaknesses[0];
    narrative += `The primary opportunity lies in ${primaryWeakness.name.toLowerCase()}, where ${primaryIssue}. `;
  } else if (moderate.length > 0) {
    narrative += `While showing solid fundamentals, there are clear opportunities to enhance performance. `;
  }

  narrative += recommendation;

  return narrative;
}

function getPerformanceIcon(score: number) {
  if (score >= 70) return <TrendingUp className="text-[#06B6D4]" />; // Secondary - positive indicators
  if (score >= 50) return <AlertCircle className="text-[#F97316]" />; // Accent - moderate performance
  return <TrendingDown className="text-[#4F46E5]" />; // Primary - critical issues
}

function getPerformanceColor(score: number): string {
  if (score >= 70) return "border-[#06B6D4]/30 bg-[#06B6D4]/5"; // Secondary - good scores
  if (score >= 50) return "border-[#F97316]/30 bg-[#F97316]/5"; // Accent - moderate
  return "border-[#4F46E5]/30 bg-[#4F46E5]/5"; // Primary - low scores/critical issues
}

const AINarrativeSummary: React.FC<AINarrativeSummaryProps> = ({ scores, businessName }) => {
  const narrative = generateNarrativeSummary(scores, businessName);
  const performanceColor = getPerformanceColor(scores.overallAeoScore);
  const icon = getPerformanceIcon(scores.overallAeoScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`rounded-xl border-2 p-6 mb-8 ${performanceColor}`}
    >
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex-shrink-0 p-3 bg-white rounded-lg shadow-sm"
        >
          <Brain className="h-6 w-6 text-[#4F46E5]" />
        </motion.div>
        
        <div className="flex-1">
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2"
          >
            AI Analysis Summary
            {icon}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-700 leading-relaxed text-base"
          >
            {narrative}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-4 flex items-center gap-2 text-sm text-slate-600"
          >
            <div className="w-2 h-2 bg-[#4F46E5] rounded-full"></div>
            <span>AI-generated insights based on {Object.keys(scores).length} performance metrics</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AINarrativeSummary;