import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | XenlixAI - Access Your AI Marketing Dashboard",
  description: "Sign in to your XenlixAI account to access your AI marketing dashboard, AEO optimization tools, and campaign analytics.",
  keywords: "sign in XenlixAI, login, AI marketing dashboard, AEO tools access",
  robots: "noindex, nofollow", // Authentication pages should not be indexed
  openGraph: {
    title: "Sign In | XenlixAI - Access Your AI Marketing Dashboard",
    description: "Sign in to your XenlixAI account to access your AI marketing dashboard, AEO optimization tools, and campaign analytics.",
    type: "website",
    url: "https://www.xenlixai.com/signin",
    siteName: "XenlixAI",
    images: [
      {
        url: "https://www.xenlixai.com/og-signin.jpg",
        width: 1200,
        height: 630,
        alt: "Sign In to XenlixAI - Access Your AI Marketing Dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | XenlixAI - Access Your AI Marketing Dashboard",
    description: "Sign in to your XenlixAI account to access your AI marketing dashboard, AEO optimization tools, and campaign analytics.",
    creator: "@XenlixAI",
    images: ["https://www.xenlixai.com/og-signin.jpg"]
  },
  alternates: {
    canonical: "https://www.xenlixai.com/signin"
  }
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}