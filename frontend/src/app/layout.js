import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import ToastProvider from "@/components/ToastProvider";

export const metadata = {
  title: "Hertzsoft ERP — Operations & Management",
  description: "Centralized ERP and Operations System for Hertzsoft Technologies",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F4F8FC] text-[#19324D]">
        <AuthProvider>
          <SidebarProvider>
            {children}
            <ToastProvider />
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
