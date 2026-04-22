import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title:       "EMR Blockchain — Sistem Rekam Medis Elektronik",
  description: "Platform rekam medis elektronik berbasis blockchain untuk memastikan integritas data medis.",
  keywords:    "EMR, rekam medis, blockchain, Ethereum, Solidity, rumah sakit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1e293b",
                color: "#f8fafc",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
