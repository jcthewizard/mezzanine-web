import type { Metadata } from "next";
import { Libre_Baskerville, DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mezzanine Properties, Inc. | Commercial Real Estate & Asset Management",
  description: "Mezzanine Properties provides comprehensive advice, execution, asset management, and investment management services for real estate and real estate-related assets.",
  keywords: ["commercial real estate", "asset management", "investment management", "Bellevue", "real estate investment"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${libreBaskerville.variable} ${dmSans.variable} antialiased font-serif`}>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
