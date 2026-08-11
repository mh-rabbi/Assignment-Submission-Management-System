"use client";

import Link from "next/link";
import { useUsers } from "@/hooks/useUsers";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useAssignments } from "@/hooks/useAssignments";
import { Users, School, BookMarked, FileText, ArrowRight, ShieldCheck, UserPlus } from "lucide-react";

export default function AdminDashboardPage() {
  const { users, isLoading: loadingUsers } = useUsers();
  const { classes, isLoading: loadingClasses } = useClasses();
  const { subjects, isLoading: loadingSubjects } = useSubjects();
  const { assignments, isLoading: loadingAssignments } = useAssignments();

  const totalTeachers = users.filter((u) => u.role === "Teacher").length;
  const totalStudents = users.filter((u) => u.role === "Student").length;

  const stats = [
    { label: "Total Users", value: users.length, sub: `${totalTeachers} Teachers, ${totalStudents} Students`, icon: Users, href: "/admin/users", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50" },
    { label: "Active Classes", value: classes.length, sub: "Configured grade levels", icon: School, href: "/admin/classes", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" },
    { label: "Subjects", value: subjects.length, sub: "Curriculum courses", icon: BookMarked, href: "/admin/subjects", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50" },
    { label: "Assignments", value: assignments.length, sub: "Across all subjects", icon: FileText, href: "/admin/assignments", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground text-sm">
          System health, user accounts, and structural assignments
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border bg-card space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Quick User Actions
            </h2>
            <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage user access, edit credentials, or register new teachers and students into the system.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Manage Users & Roles
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" /> Teacher Allocation
            </h2>
            <Link href="/admin/teacher-assignments" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View Matrix <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Assign teachers to specific subjects and classes to authorize them for assignment creation.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/teacher-assignments"
              className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Manage Teacher Mapping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
