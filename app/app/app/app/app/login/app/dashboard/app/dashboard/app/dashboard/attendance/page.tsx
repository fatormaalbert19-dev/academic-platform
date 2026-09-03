import { createClient } from "@/lib/supabase/server";
import AttendanceBoard from "./attendance-board";

export default async function AttendancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  const isStaff = profile?.role === "admin" || profile?.role === "lecturer";

  const { data: courses } = await supabase
    .from("courses")
    .select("id, code, title")
    .order("code");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
      <p className="text-slate-500 mt-1">
        {isStaff
          ? "Open a session and mark who showed up."
          : "Your attendance record across enrolled courses."}
      </p>

      <div className="mt-6">
        <AttendanceBoard courses={courses ?? []} isStaff={isStaff} userId={user!.id} />
      </div>
    </div>
  );
}
