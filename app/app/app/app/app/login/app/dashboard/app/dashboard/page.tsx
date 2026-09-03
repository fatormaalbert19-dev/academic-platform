import { createClient } from "@/lib/supabase/server";

export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user?.id)
    .single();

  const { count: courseCount } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome, {profile?.full_name?.split(" ")[0] ?? "there"}
      </h1>
      <p className="text-slate-500 mt-1 capitalize">{profile?.role} dashboard</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Courses</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{courseCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Attendance</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">—</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Pending grading</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">—</p>
        </div>
      </div>
    </div>
  );
}
