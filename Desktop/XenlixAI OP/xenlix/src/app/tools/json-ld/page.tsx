import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Metadata } from "next";
import JsonLdGenerator from "./_components/JsonLdGenerator";

export const metadata: Metadata = {
  title: "JSON-LD Generator Tool | Create Structured Data for AEO - XenlixAI",
  description: "Advanced JSON-LD structured data generator for Answer Engine Optimization. Create schema markup to help AI search engines understand and recommend your business.",
  keywords: "JSON-LD generator, AEO structured data, AI search schema, answer engine optimization markup, ChatGPT schema",
  robots: "noindex, nofollow", // Private tool for authenticated users
  alternates: {
    canonical: "/tools/json-ld"
  }
};

export default async function JsonLdPage() {
  // Server-side authentication check
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative">
        {/* Particles background */}
        <div id="particles-js" className="absolute inset-0 pointer-events-none"></div>
        
        {/* Navigation */}
        <nav className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="brand-name-glow text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  XenlixAI
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </a>
                <a href="/guidance" className="text-gray-300 hover:text-white transition-colors">
                  Guidance
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              JSON-LD Generator
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Generate structured data for your business website to improve search engine visibility 
              and enable rich snippets.
            </p>
          </div>

          {/* Generator component */}
          <JsonLdGenerator userEmail={session.user.email} />
        </div>
      </div>
    </div>
  );
}