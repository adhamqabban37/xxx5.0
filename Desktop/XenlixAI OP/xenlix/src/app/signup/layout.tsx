import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | XenlixAI - Start Your AI Marketing Journey",
  description: "Create your XenlixAI account and start optimizing your business for AI search engines. Get access to AEO tools, AI marketing automation, and expert guidance.",
  keywords: "sign up XenlixAI, create account, AI marketing registration, AEO tools access, AI search optimization",
  robots: "noindex, nofollow", // Authentication pages should not be indexed
  alternates: {
    canonical: "/signup"
  }
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}