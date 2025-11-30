// "use client";

import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
// leaflet css for controls
import "leaflet/dist/leaflet.css";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import ClientProviders from "@/components/client-providers";

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
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-black text-white overflow-x-hidden selection:bg-[#00E676]/30`}>
        <ClientProviders>
          {/* Top Loading Bar */}
          <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none">
              <ScrollProgress className="h-1 bg-[#00E676]" />
          </div>

          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

export const metadata = {
      generator: 'v0.app'
    };
