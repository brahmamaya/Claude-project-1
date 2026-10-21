import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = { title: "Test Series – JEE / NEET", description: "Mock tests for JEE Main, Advanced and NEET" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/"><b>TestSeries</b></Link>
          <span>
            {user ? (<>{user.email} · <LogoutButton /></>) : <Link href="/login">Login</Link>}
          </span>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
