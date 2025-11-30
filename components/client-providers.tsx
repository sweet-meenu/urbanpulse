"use client"

import React from "react"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/context/AuthContext"
import { ToastProvider } from "@heroui/toast"

export const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
    </ThemeProvider>
  )
}

export default ClientProviders
