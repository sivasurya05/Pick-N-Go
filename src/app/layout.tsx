import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pick N' Go | Campus Food Ordering",
  description: "Delicious food from your campus kitchens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="mobile-container">
          <main className="pb-24">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
