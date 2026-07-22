import type { Metadata } from "next";
import { Libre_Caslon_Text, Source_Serif_4, Work_Sans } from "next/font/google";
import "./globals.css";

const libreCaslon = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-body",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Bete",
  description: "Ethiopian real estate marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${libreCaslon.variable} ${sourceSerif.variable} ${workSans.variable} bg-[#fbf9f5] text-[#1b1c1a] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
