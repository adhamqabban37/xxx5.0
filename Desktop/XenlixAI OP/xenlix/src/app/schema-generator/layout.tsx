import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schema Generator | Free JSON-LD Structured Data Generator - XenlixAI",
  description: "Generate structured data (JSON-LD schema markup) for your business to improve SEO and AI search visibility. Free schema generator for local business, FAQ, product, and organization markup.",
  keywords: "schema generator, JSON-LD generator, structured data generator, schema markup, local business schema, FAQ schema, SEO schema",
  openGraph: {
    title: "Schema Generator | Free JSON-LD Structured Data Generator - XenlixAI",
    description: "Generate structured data (JSON-LD schema markup) for your business to improve SEO and AI search visibility. Free schema generator for local business, FAQ, product, and organization markup.",
    type: "website",
    url: "/schema-generator",
    images: [
      {
        url: "/og-schema-generator.jpg",
        width: 1200,
        height: 630,
        alt: "Schema Generator Tool - XenlixAI"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Schema Generator | Free JSON-LD Structured Data Generator - XenlixAI",
    description: "Generate structured data (JSON-LD schema markup) for your business to improve SEO and AI search visibility. Free schema generator for local business, FAQ, product, and organization markup.",
    images: ["/twitter-schema-generator.jpg"]
  },
  alternates: {
    canonical: "/schema-generator"
  }
};

export default function SchemaGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}