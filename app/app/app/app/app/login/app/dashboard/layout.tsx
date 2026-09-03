import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarCheck, ClipboardList, GraduationCap, LayoutDashboard } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, institution_id, institutions(name)")
    .eq("id", user.id)
    .single();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
    { href: "/dashboard/grades", label: "Grades", icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-56 bg-slate-900 text-slate-200 flex-col hidden md:flex">
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="text-sm font-semibold text-white truncate">
            {(profile as any)?.institutions?.name ?? "Your Institution"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">{profile?.role ?? "member"}</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition"
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-400 truncate">
          {profile?.full_name}
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
