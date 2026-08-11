"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "./CurrentUserProvider";
import {
  Users,
  School,
  BookMarked,
  UserCheck,
  FileText,
  PlusCircle,
  CheckSquare,
  Home,
  Clock,
} from "lucide-react";

export function Sidebar() {
  const user = useCurrentUser();
  const pathname = usePathname();

  if (!user) return null;

  const role = user.role;

  const adminNav = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/classes", label: "Classes", icon: School },
    { href: "/admin/subjects", label: "Subjects", icon: BookMarked },
    { href: "/admin/teacher-assignments", label: "Teacher Assignments", icon: UserCheck },
    { href: "/admin/assignments", label: "All Assignments", icon: FileText },
  ];

  const teacherNav = [
    { href: "/teacher", label: "Dashboard", icon: Home },
    { href: "/teacher/assignments", label: "My Assignments", icon: FileText },
    { href: "/teacher/assignments/new", label: "Create Assignment", icon: PlusCircle },
    { href: "/teacher/submissions", label: "Grade Submissions", icon: CheckSquare },
  ];

  const studentNav = [
    { href: "/student", label: "Dashboard", icon: Home },
    { href: "/student/assignments", label: "Available Assignments", icon: FileText },
    { href: "/student/submissions", label: "My Submissions", icon: Clock },
  ];

  const navItems = role === "Admin" ? adminNav : role === "Teacher" ? teacherNav : studentNav;

  return (
    <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)] p-4 flex flex-col gap-6">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {role} Portal
        </h2>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === `/${role.toLowerCase()}`
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-accent/50 to-accent/20 border text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">Role-Based Access</p>
        <p>You are logged in as <span className="font-semibold text-primary">{user.role}</span>.</p>
      </div>
    </aside>
  );
}
