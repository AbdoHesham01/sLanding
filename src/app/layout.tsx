import type { Metadata } from "next";
import { Almarai } from "next/font/google";
import "./globals.css";

// Almarai font for English
const almarai = Almarai({
  subsets: ["latin"], // only need latin for English
  weight: ["300", "400", "700"], // choose the weights you need
  variable: "--font-almarai",
});

export const metadata: Metadata = {
  title: "Siwa Tourism",
  description: "Explore the beauty of Siwa, Egypt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${almarai.variable} font-sans antialiased `}>
        {children}
      </body>
    </html>
  );
}
