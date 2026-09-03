"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string;
  code: string;
  title: string;
}

interface AssignmentRow {
  id: string;
  title: string;
  weight: number;
  max_score: number;
  due_at: string | null;
}

export default function AssignmentsBoard({ courses, isStaff }: { courses: Course[]; isStaff: boolean }) {
  const supabase = createClient();
  const [selectedCourse, setSelectedCourse] = useState<string>(courses[0]?.id ?? "");
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [form, setForm] = useState({ title: "", weight: 10, max_score: 100, due_at: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (selectedCourse) loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  async function loadAssignments() {
    const { data } = await supabase
      .from("assignments")
      .select("id, title, weight, max_score, due_at")
      .eq("course_id", selectedCourse)
      .order("due_at");
    setAssignments(data ?? []);
  }

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await supabase.from("assignments").insert({
      course_id: selectedCourse,
      title: form.title,
      weight: form.weight,
      max_score: form.max_score,
      due_at: form.due_at || null,
    });
    setForm({ title: "", weight: 10, max_score: 100, due_at: "" });
    setCreating(false);
    loadAssignments();
  }

  return (
    <div className="space-y-6">
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

      {isStaff && (
        <form onSubmit={createAssignment} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-slate-500 mb-1">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Quiz 1"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Weight %</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Max score</label>
            <input
              type="number"
              value={form.max_score}
              onChange={(e) => setForm({ ...form, max_score: Number(e.target.value) })}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Due date</label>
            <input
              type="date"
              value={form.due_at}
              onChange={(e) => setForm({ ...form, due_at: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            disabled={creating}
            className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {creating ? "Adding..." : "Add"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {assignments.length === 0 && (
          <p className="text-sm text-slate-500 p-5">No assignments for this course yet.</p>
        )}
        {assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-slate-800">{a.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {a.weight}% of CA · out of {a.max_score}
                {a.due_at ? ` · due ${new Date(a.due_at).toLocaleDateString()}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
