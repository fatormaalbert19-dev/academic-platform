"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AttendanceStatus } from "@/lib/types";

interface Course {
  id: string;
  code: string;
  title: string;
}

interface Student {
  id: string;
  full_name: string;
  status: AttendanceStatus;
}

export default function AttendanceBoard({
  courses,
  isStaff,
  userId,
}: {
  courses: Course[];
  isStaff: boolean;
  userId: string;
}) {
  const supabase = createClient();
  const [selectedCourse, setSelectedCourse] = useState<string>(courses[0]?.id ?? "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  async function openTodaySession() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabase
      .from("class_sessions")
      .select("id")
      .eq("course_id", selectedCourse)
      .eq("session_date", today)
      .maybeSingle();

    let sid = existing?.id;
    if (!sid) {
      const { data: created } = await supabase
        .from("class_sessions")
        .insert({ course_id: selectedCourse, session_date: today })
        .select("id")
        .single();
      sid = created?.id;
    }
    setSessionId(sid ?? null);

    const { data: enrolled } = await supabase
      .from("enrollments")
      .select("student_id, profiles(id, full_name)")
      .eq("course_id", selectedCourse);

    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .eq("session_id", sid);

    const recordMap = new Map((records ?? []).map((r) => [r.student_id, r.status]));

    setStudents(
      (enrolled ?? []).map((e: any) => ({
        id: e.profiles.id,
        full_name: e.profiles.full_name,
        status: recordMap.get(e.profiles.id) ?? "absent",
      }))
    );
    setLoading(false);
  }

  async function setStatus(studentId: string, status: AttendanceStatus) {
    if (!sessionId) return;
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)));

    await supabase.from("attendance_records").upsert(
      {
        session_id: sessionId,
        student_id: studentId,
        status,
        marked_by: userId,
      },
      { onConflict: "session_id,student_id" }
    );
  }

  if (!isStaff) {
    return (
      <p className="text-sm text-slate-500">
        Attendance history will appear here once your lecturer opens a session.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
        <button
          onClick={openTodaySession}
          disabled={!selectedCourse || loading}
          className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Open today's session"}
        </button>
      </div>

      {students.length > 0 && (
        <div className="mt-5 divide-y divide-slate-100">
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-800">{s.full_name}</span>
              <div className="flex gap-1">
                {(["present", "late", "excused", "absent"] as AttendanceStatus[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setStatus(s.id, opt)}
                    className={`text-xs px-2.5 py-1 rounded-full border capitalize transition ${
                      s.status === opt
                        ? "bg-slate-900 text-white border-slate-900"
                        : "text-slate-500 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
