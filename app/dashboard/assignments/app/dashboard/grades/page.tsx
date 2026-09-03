import { createClient } from "@/lib/supabase/server";
import GradesBoard from "./grades-board";

export default async function GradesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  const isStaff = profile?.role === "admin" || profile?.role === "lecturer" || profile?.role === "registrar";

  const { data: courses } = await supabase
    .from("courses")
    .select("id, code, title")
    .order("code");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Grades</h1>
      <p className="text-slate-500 mt-1">
        {isStaff ? "Compile CA and exam scores, then publish." : "Your published grades."}
      </p>
      <div className="mt-6">
        <GradesBoard courses={courses ?? []} isStaff={isStaff} userId={user!.id} />
      </div>
    </div>
  );
}
