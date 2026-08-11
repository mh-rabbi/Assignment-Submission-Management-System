import Link from "next/link";
import { cookies } from "next/headers";
import { decodeToken } from "@/lib/auth";
import {
  BookOpen,
  CheckCircle2,
  Shield,
  GraduationCap,
  Sparkles,
  ArrowRight,
  School,
  FileCheck,
  Award,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const userInfoCookie = cookieStore.get("user_info")?.value;

  let user = token ? decodeToken(token) : null;
  if (user && userInfoCookie) {
    try {
      const parsed = JSON.parse(userInfoCookie);
      if (parsed.name) user.name = parsed.name;
    } catch {}
  }

  const rolePath = user ? `/${user.role.toLowerCase()}` : "/login";

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-background via-accent/20 to-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Next-Gen Assignment & Submission Management</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              Streamline Assignments from{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Classroom to Grading
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Empowering Administrators, Teachers, and Students with role-based workflows, automated status tracking, late submission controls, and full history auditing.
            </p>

            {user ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link
                  href={rolePath}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                >
                  Go to {user.role} Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Logged in as</span>
                  <span className="font-semibold text-foreground">{user.name || user.email}</span>
                  <StatusBadge status={user.role} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border bg-card px-8 py-3.5 text-base font-semibold text-foreground shadow-sm hover:bg-accent transition-all"
                >
                  Sign In to Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Role Feature Cards */}
      <section className="py-16 md:py-24 bg-card border-y">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center space-y-4 mb-14">
            <h2 className="text-3xl font-bold tracking-tight">Built for Every Role in Education</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tailored dashboards and tools engineered specifically for system administrators, educators, and students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Admin */}
            <div className="group rounded-2xl border p-8 bg-background hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Administrator Portal</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Full governance over users, classes, subjects, and teacher-subject assignments with granular audit capabilities.
              </p>
              <ul className="space-y-2.5 text-xs font-medium text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> User role management & activation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Class & Subject allocation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Teacher-Class mapping matrix
                </li>
              </ul>
            </div>

            {/* Teacher */}
            <div className="group rounded-2xl border p-8 bg-background hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Teacher Hub</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Draft, publish, and manage assignments for your assigned classes. Grade submissions with custom feedback.
              </p>
              <ul className="space-y-2.5 text-xs font-medium text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Draft / Publish / Close status lifecycle
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Deadline & late submission controls
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Inline grading & feedback tools
                </li>
              </ul>
            </div>

            {/* Student */}
            <div className="group rounded-2xl border p-8 bg-background hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <School className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Student Portal</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                View published assignments for your class, upload files or text content, track grades, and inspect edit history.
              </p>
              <ul className="space-y-2.5 text-xs font-medium text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Drag-and-drop file submissions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Submission history & versioning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Real-time grade & feedback view
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
