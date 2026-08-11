import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/query-client";
import { CurrentUserProvider } from "@/components/shared/CurrentUserProvider";
import { Navbar } from "@/components/shared/Navbar";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import { decodeToken } from "@/lib/auth";
import type { CurrentUser } from "@/types/api";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduTask Pro — Role-Based Assignment & Submission Management",
  description:
    "A role-based assignment submission and management platform for Admin, Teacher, and Student workflows.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const userInfoCookie = cookieStore.get("user_info")?.value;

  let currentUser: CurrentUser | null = null;

  if (token) {
    const decoded = decodeToken(token);
    if (decoded) {
      currentUser = decoded;
      if (userInfoCookie) {
        try {
          const parsed = JSON.parse(userInfoCookie);
          if (parsed.name) currentUser.name = parsed.name;
        } catch {}
      }
    }
  }

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ReactQueryProvider>
          <CurrentUserProvider user={currentUser}>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <div className="flex-1">{children}</div>
            </div>
            <Toaster position="top-right" richColors />
          </CurrentUserProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
