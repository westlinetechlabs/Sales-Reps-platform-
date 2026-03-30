import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
    <html lang="en" className="h-full dark">
      <head>
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
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(255,255,255,0.08)",
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
      </body>
    </html>
  );
}
