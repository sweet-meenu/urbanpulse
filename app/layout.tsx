// "use client";

import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
// leaflet css for controls
import "leaflet/dist/leaflet.css";
import { ReactLenis } from "lenis/react";
import { ThemeProvider } from "next-themes";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@heroui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Custom Lenis options for the "Smooth Jerk" / High Momentum feel
  const lenisOptions = {
    duration: 1.6,         // Higher = "floatier" drift (The slow jerk stop)
    smoothWheel: true,
    wheelMultiplier: 1.5,  // Higher = faster initial acceleration (The fast start)
    touchMultiplier: 2,    // Responsive on touch
    infinite: false,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-black text-white overflow-x-hidden selection:bg-[#00E676]/30`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {/* Apply options here */}
          <ReactLenis root options={lenisOptions}>
            <AuthProvider>
              {/* Top Loading Bar */}
              <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none">
                  <ScrollProgress className="h-1 bg-[#00E676]" />
              </div>

              {children}

              <ToastProvider
                placement="top-right"
                toastOffset={80}
                maxVisibleToasts={3}
                toastProps={{
                  radius: "lg",
                  variant: "flat",
                  shadow: "md",
                  classNames: {
                    base: "max-w-sm w-full bg-slate-900/90 border border-white/10 text-white backdrop-blur-2xl",
                  },
                }}
              />
            </AuthProvider>
          </ReactLenis>
        </ThemeProvider>
      </body>
    </html>
  );
}

export const metadata = {
      generator: 'v0.app'
    };
