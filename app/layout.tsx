import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IncidentRoom — close incidents in Switch chat",
  description:
    "On-call incident closeout teammates in Switch. Triage, reproduce, propose rollback, human Confirm.",
  openGraph: {
    title: "IncidentRoom",
    description: "Close the incident in the Switch room.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site">{children}</div>
      </body>
    </html>
  );
}
