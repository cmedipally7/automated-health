import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "NutriPlan — Your week, made simple",
    description: "Personalized meal planning for your nutrition goals, recipes, and grocery list.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "NutriPlan — Your week, made simple",
      description: "Personalized meal planning for your nutrition goals, recipes, and grocery list.",
      images: [{ url: `${origin}/og.png`, width: 1732, height: 908, alt: "NutriPlan weekly meal planning" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "NutriPlan — Your week, made simple",
      description: "Personalized meal planning for your nutrition goals, recipes, and grocery list.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
