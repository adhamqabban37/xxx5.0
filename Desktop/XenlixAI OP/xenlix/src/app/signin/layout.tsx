import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | XenlixAI - Access Your AI Marketing Dashboard",
  description: "Sign in to your XenlixAI account to access your AI marketing dashboard, AEO optimization tools, and campaign analytics.",
  keywords: "sign in XenlixAI, login, AI marketing dashboard, AEO tools access",
  robots: "noindex, nofollow", // Authentication pages should not be indexed
  alternates: {
    canonical: "/signin"
  }
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}