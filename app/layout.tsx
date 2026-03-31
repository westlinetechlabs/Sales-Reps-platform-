import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SplashScreen from "@/components/SplashScreen";

export const metadata: Metadata = {
  title: "Westline Techlabs — Sales Portal",
  description: "Design. Build. Deliver. — Field sales representative portal by Westline Techlabs",
  icons: {
    icon: "https://res.cloudinary.com/djayrwxns/image/upload/v1772931726/westline_favicon_wwht4g.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Anti-flash: apply saved theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('wl-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.add(d?'dark':'light');}catch(e){}})();`,
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="https://res.cloudinary.com/djayrwxns/image/upload/v1772931726/westline_favicon_wwht4g.png" type="image/png" />
        <link rel="shortcut icon" href="https://res.cloudinary.com/djayrwxns/image/upload/v1772931726/westline_favicon_wwht4g.png" type="image/png" />
        <link rel="apple-touch-icon" href="https://res.cloudinary.com/djayrwxns/image/upload/v1772931726/westline_favicon_wwht4g.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="h-full antialiased"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <ThemeProvider>
          <SplashScreen />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(20,18,10,0.92)",
                backdropFilter: "blur(20px)",
                color: "#e8e4dc",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#F5A800", secondary: "#000" },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
