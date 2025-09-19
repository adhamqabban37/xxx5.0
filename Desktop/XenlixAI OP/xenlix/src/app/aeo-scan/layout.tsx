import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AEO Scan | Answer Engine Optimization Audit - XenlixAI",
  description: "Get a free AEO (Answer Engine Optimization) audit to see why your website isn't showing up in ChatGPT, Claude, Perplexity and other AI search engines. Instant results in 60 seconds.",
  keywords: "AEO scan, answer engine optimization audit, AI search audit, ChatGPT SEO, free website audit, AI visibility check",
  openGraph: {
    title: "Free AEO Scan | Answer Engine Optimization Audit - XenlixAI",
    description: "Get a free AEO (Answer Engine Optimization) audit to see why your website isn't showing up in ChatGPT, Claude, Perplexity and other AI search engines. Instant results in 60 seconds.",
    type: "website",
    url: "/aeo-scan",
    images: [
      {
        url: "/og-aeo-scan.jpg",
        width: 1200,
        height: 630,
        alt: "Free AEO Scan - Answer Engine Optimization Audit"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AEO Scan | Answer Engine Optimization Audit - XenlixAI",
    description: "Get a free AEO (Answer Engine Optimization) audit to see why your website isn't showing up in ChatGPT, Claude, Perplexity and other AI search engines. Instant results in 60 seconds.",
    images: ["/twitter-aeo-scan.jpg"]
  },
  alternates: {
    canonical: "/aeo-scan"
  }
};

export default function AEOScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}