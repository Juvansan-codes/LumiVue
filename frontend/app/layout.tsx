import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LumiVue — Evidence-Grounded Medical Image Intelligence",
  description:
    "AI-powered second-opinion assistant for chest X-ray pneumonia assessment. " +
    "Evidence-grounded multimodal analysis combining visual evidence with clinical context.",
  keywords: [
    "medical AI",
    "chest X-ray",
    "pneumonia detection",
    "clinical decision support",
    "evidence-grounded",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[var(--lv-black)]">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
