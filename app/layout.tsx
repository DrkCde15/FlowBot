import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FlowBot — Chatbot Builder",
  description: "Self-hostable conversational flow builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
