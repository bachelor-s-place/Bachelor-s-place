import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import GoogleProvider from "@/components/GoogleProvider";
import LayoutContent from "@/components/LayoutContent";
import "./globals.css";


// Geist = premium geometric grotesk (primary UI/display). Geist_Mono = numerals/IDs.
// Inter stays loaded as a fallback alias so any not-yet-migrated style keeps rendering.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--font-mono-stack",
  subsets: ["latin"],
  display: "swap",
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BachelorsSpace - Premium Co-living in Ahmedabad & Rajkot",
  description: "AI-driven matchmaking and spatial discovery for premium roommates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Prevent flash of unstyled content — read saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('bs-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} ${inter.variable}`}>
        <GoogleProvider>
          <AuthProvider>
            <div style={{ position: 'relative', minHeight: '100vh', isolation: 'isolate', display: 'flex', flexDirection: 'column' }}>
              <LayoutContent>
                {children}
              </LayoutContent>
            </div>
          </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
