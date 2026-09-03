"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string;
  code: string;
  title: string;
}

interface GradeRow {
  student_id: string;
  full_name: string;
  ca_score: number;
  exam_score: number;
  final_score: number;
  published: boolean;
}

export default function GradesBoard({
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
  const [rows, setRows] = useState<GradeRow[]>([]);

  useEffect(() => {
    if (selectedCourse) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  async function load() {
    if (isStaff) {
      const { data: enrolled } = await supabase
        .from("enrollments")
        .select("student_id, profiles(id, full_name)")
        .eq("course_id", selectedCourse);

      const { data: grades } = await supabase
        .from("final_grades")
        .select("student_id, ca_score, exam_score, final_score, published")
        .eq("course_id", selectedCourse);

      const gradeMap = new Map((grades ?? []).map((g) => [g.student_id, g]));

      setRows(
        (enrolled ?? []).map((e: any) => {
          const g = gradeMap.get(e.profiles.id);
          return {
            student_id: e.profiles.id,
            full_name: e.profiles.full_name,
            ca_score: g?.ca_score ?? 0,
            exam_score: g?.exam_score ?? 0,
            final_score: g?.final_score ?? 0,
            published: g?.published ?? false,
          };
        })
      );
    } else {
      const { data } = await supabase
        .from("final_grades")
        .select("student_id, ca_score, exam_score, final_score, published")
        .eq("student_id", userId)
        .eq("published", true);
      setRows(
        (data ?? []).map((g) => ({
          student_id: g.student_id,
          full_name: "You",
          ca_score: g.ca_score,
          exam_score: g.exam_score,
          final_score: g.final_score,
          published: g.published,
        }))
      );
    }
  }

  async function updateScore(studentId: string, field: "ca_score" | "exam_score", value: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.student_id === studentId
          ? { ...r, [field]: value, final_score: field === "ca_score" ? value + r.exam_score : r.ca_score + value }
          : r
      )
    );
  }

  async function saveRow(row: GradeRow) {
    await supabase.from("final_grades").upsert(
      {
        course_id: selectedCourse,
        student_id: row.student_id,
        ca_score: row.ca_score,
        exam_score: row.exam_score,
        final_score: row.ca_score + row.exam_score,
        published: row.published,
      },
      { onConflict: "course_id,student_id" }
    );
  }

  async function togglePublish(row: GradeRow) {
    const updated = { ...row, published: !row.published };
    setRows((prev) => prev.map((r) => (r.student_id === row.student_id ? updated : r)));
    await saveRow(updated);
  }

  return (
    <div className="space-y-4">
      {isStaff && (
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
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="p-3 font-medium">Student</th>
              <th className="p-3 font-medium">CA</th>
              <th className="p-3 font-medium">Exam</th>
              <th className="p-3 font-medium">Final</th>
              {isStaff && <th className="p-3 font-medium">Status</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student_id} className="border-b border-slate-50 last:border-0">
                <td className="p-3 text-slate-800">{r.full_name}</td>
                <td className="p-3">
                  {isStaff ? (
                    <input
                      type="number"
                      value={r.ca_score}
                      onChange={(e) => updateScore(r.student_id, "ca_score", Number(e.target.value))}
                      onBlur={() => saveRow(r)}
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                  ) : (
                    r.ca_score
                  )}
                </td>
                <td className="p-3">
                  {isStaff ? (
                    <input
                      type="number"
                      value={r.exam_score}
                      onChange={(e) => updateScore(r.student_id, "exam_score", Number(e.target.value))}
                      onBlur={() => saveRow(r)}
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                  ) : (
                    r.exam_score
                  )}
                </td>
                <td className="p-3 font-medium text-slate-900">{r.final_score}</td>
                {isStaff && (
                  <td className="p-3">
                    <button
                      onClick={() => togglePublish(r)}
                      className={`text-xs px-2.5 py-1 rounded-full border ${
                        r.published
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "text-slate-500 border-slate-200"
                      }`}
                    >
                      {r.published ? "Published" : "Draft"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-5 text-center text-slate-400">
                  No grades yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
