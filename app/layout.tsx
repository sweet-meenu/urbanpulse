// "use client";

import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
// leaflet css for controls
import "leaflet/dist/leaflet.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Custom Lenis options for the "Smooth Jerk" / High Momentum feel

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export const metadata = {
      generator: 'v0.app'
    };
