"use client"

import React from "react"
import { ReactLenis } from "lenis/react"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/context/AuthContext"
import { ToastProvider } from "@heroui/toast"

export const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  const lenisOptions = {
    duration: 1.6,
    smoothWheel: true,
    wheelMultiplier: 1.5,
    touchMultiplier: 2,
    infinite: false,
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ReactLenis root options={lenisOptions}>
        <AuthProvider>
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
          >
            {children}
          </ToastProvider>
        </AuthProvider>
      </ReactLenis>
    </ThemeProvider>
  )
}

export default ClientProviders
