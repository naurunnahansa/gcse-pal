import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProviderWrapper } from "@/components/AuthProviderWrapper";
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GCSEPal - Your AI-powered companion for GCSE success",
  description: "Personalized study support, smart assessments, and adaptive learning paths designed to help you ace your GCSEs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <AuthProviderWrapper>
            {children}
          </AuthProviderWrapper>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
