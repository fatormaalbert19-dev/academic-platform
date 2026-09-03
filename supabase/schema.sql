-- ============================================================
-- Academic Management Platform — Database Schema
-- Multi-tenant: every core table is scoped to an institution_id
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- INSTITUTIONS ----------
create table institutions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  short_code text unique not null,      -- e.g. "NUS", "FBC"
  logo_url text,
  created_at timestamptz default now()
);

-- ---------- USER PROFILES ----------
-- extends Supabase's built-in auth.users
create type user_role as enum ('admin', 'lecturer', 'student', 'registrar');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid references institutions(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'student',
  student_id text,                      -- matriculation/student number, if applicable
  staff_id text,                        -- staff number, if applicable
  avatar_url text,
  created_at timestamptz default now()
);

create index idx_profiles_institution on profiles(institution_id);

-- ---------- COURSES ----------
create table courses (
  id uuid primary key default uuid_generate_v4(),
  institution_id uuid references institutions(id) on delete cascade not null,
  code text not null,                   -- e.g. "CSC 301"
  title text not null,
  lecturer_id uuid references profiles(id),
  semester text,                        -- e.g. "2026/2027 Semester 1"
  credit_hours int default 3,
  created_at timestamptz default now()
);

create index idx_courses_institution on courses(institution_id);

-- ---------- ENROLLMENTS ----------
create table enrollments (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique (course_id, student_id)
);

-- ---------- ATTENDANCE ----------
create table class_sessions (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade not null,
  session_date date not null,
  topic text,
  checkin_code text,                    -- short rotating code students enter, or QR payload
  code_expires_at timestamptz,
  created_at timestamptz default now()
);

create type attendance_status as enum ('present', 'absent', 'late', 'excused');

create table attendance_records (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references class_sessions(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  status attendance_status not null default 'absent',
  marked_at timestamptz default now(),
  marked_by uuid references profiles(id),   -- lecturer override, null if self check-in
  unique (session_id, student_id)
);

-- ---------- ASSIGNMENTS / CONTINUOUS ASSESSMENT ----------
create table assignments (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade not null,
  title text not null,
  description text,
  weight numeric(5,2) not null default 0,  -- % weight toward final CA
  max_score numeric(6,2) not null default 100,
  due_at timestamptz,
  created_at timestamptz default now()
);

create table submissions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid references assignments(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  file_url text,
  submitted_at timestamptz default now(),
  score numeric(6,2),
  feedback text,
  graded_at timestamptz,
  graded_by uuid references profiles(id),
  unique (assignment_id, student_id)
);

-- ---------- FINAL GRADES ----------
create table grading_scales (
  id uuid primary key default uuid_generate_v4(),
  institution_id uuid references institutions(id) on delete cascade not null,
  label text not null,                  -- e.g. "First Class", "A"
  min_score numeric(5,2) not null,
  max_score numeric(5,2) not null,
  gpa_value numeric(3,2)
);

create table final_grades (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  ca_score numeric(6,2) default 0,      -- computed from submissions * weight
  exam_score numeric(6,2) default 0,
  final_score numeric(6,2) default 0,
  letter_grade text,
  published boolean default false,
  updated_at timestamptz default now(),
  unique (course_id, student_id)
);

-- ============================================================
-- ROW LEVEL SECURITY — every table is scoped to the caller's institution
-- ============================================================
alter table institutions enable row level security;
alter table profiles enable row level security;
alter table courses enable row level security;
alter table enrollments enable row level security;
alter table class_sessions enable row level security;
alter table attendance_records enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table final_grades enable row level security;

-- Helper: get the caller's institution_id and role from their profile
create or replace function auth_institution_id() returns uuid as $$
  select institution_id from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function auth_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- Profiles: users can see everyone in their own institution
create policy "profiles same institution" on profiles
  for select using (institution_id = auth_institution_id());

create policy "profiles self update" on profiles
  for update using (id = auth.uid());

-- Courses: visible within institution; only admin/lecturer can write
create policy "courses same institution read" on courses
  for select using (institution_id = auth_institution_id());

create policy "courses lecturer/admin write" on courses
  for all using (
    institution_id = auth_institution_id()
    and auth_role() in ('admin', 'lecturer')
  );

-- Attendance: lecturers manage, students read their own
create policy "attendance read own or staff" on attendance_records
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from class_sessions cs
      join courses c on c.id = cs.course_id
      where cs.id = session_id and c.institution_id = auth_institution_id()
      and auth_role() in ('admin', 'lecturer', 'registrar')
    )
  );

create policy "attendance write staff" on attendance_records
  for insert with check (auth_role() in ('admin', 'lecturer'));

create policy "attendance update staff" on attendance_records
  for update using (auth_role() in ('admin', 'lecturer'));

-- Grades: students see only their own, published grades
create policy "grades read own" on final_grades
  for select using (
    student_id = auth.uid() and published = true
  );

create policy "grades staff full read" on final_grades
  for select using (
    exists (
      select 1 from courses c
      where c.id = course_id and c.institution_id = auth_institution_id()
      and auth_role() in ('admin', 'lecturer', 'registrar')
    )
  );

create policy "grades staff write" on final_grades
  for all using (auth_role() in ('admin', 'lecturer', 'registrar'));

-- Institutions: readable by members only
create policy "institutions self read" on institutions
  for select using (id = auth_institution_id());
