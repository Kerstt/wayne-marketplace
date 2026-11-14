import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Wayne Market — Good stuff, down the street",
  description: "Buy and sell secondhand with people nearby.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${plexMono.variable}`}>
      <body className="min-h-screen pb-20 font-sans antialiased md:pb-0">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
