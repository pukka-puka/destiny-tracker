import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Shukumei - AI占いアプリ",
  description: "AIがあなたの宿命を読み解く。タロット、手相、易経、AIチャットで本格占い。",
  keywords: "占い, AI占い, タロット, 手相, 易経, 宿命, Shukumei",
  authors: [{ name: "Shukumei" }],
  openGraph: {
    title: 'Shukumei - AI占いアプリ',
    description: 'AIがあなたの宿命を読み解く',
    siteName: 'Shukumei',
    url: 'https://shukumei.xyz',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Shukumei - AI占いアプリ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shukumei - AI占いアプリ',
    description: 'AIがあなたの宿命を読み解く',
    images: ['/og-image.png'],
    creator: '@shukumei_ai',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Navigation />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}