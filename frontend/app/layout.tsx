import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FlowBot — Build chat bots that actually talk back",
  description:
    "Self-hostable visual builder for conversational flows. Drag, branch and embed a chat bot anywhere in minutes.",
  openGraph: {
    title: "FlowBot — Visual chatbot builder",
    description: "Self-hostable conversational flow builder with a visual editor and one-line embed.",
    type: "website",
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%235b5bd6'/%3E%3Cpath d='M9 12h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H14l-4 4v-4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z' fill='white'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('flowbot-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-card"
        >
          Skip to content
        </a>
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
