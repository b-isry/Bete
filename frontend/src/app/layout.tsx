import type { Metadata } from "next";
import { Libre_Caslon_Text, Source_Serif_4, Work_Sans } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui";
import { LanguageProvider } from "@/i18n/LanguageContext";
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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
      </head>
      <body
        className={`${libreCaslon.variable} ${sourceSerif.variable} ${workSans.variable} bg-background text-on-surface antialiased`}
      >
        <LanguageProvider>
          <ToastProvider>
            <Header />
            <main>{children}</main>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
