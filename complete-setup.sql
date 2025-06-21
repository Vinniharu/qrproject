-- QR Attendance System - Complete Database Setup (Safe Migration)
-- Run this SQL script in your Supabase SQL Editor (in order)

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Check if old 'profiles' table exists and migrate to 'user_profiles'
DO $$
BEGIN
    -- Check if profiles table exists but user_profiles doesn't
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
       AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        
        -- Rename profiles to user_profiles
        ALTER TABLE profiles RENAME TO user_profiles;
        
        -- Update any foreign key constraints that reference the old table name
        -- This will be handled automatically by PostgreSQL for most cases
        
        RAISE NOTICE 'Migrated profiles table to user_profiles';
    END IF;
END $$;

-- Step 3: Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'lecturer' CHECK (role = 'lecturer'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Step 4: Create attendance_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lecturer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  course_code TEXT NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  qr_code_data TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 5: Create attendance_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT, -- Optional field
  student_id TEXT, -- Optional student ID
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_late BOOLEAN DEFAULT false,
  late_by_minutes INTEGER DEFAULT 0,
  ip_address INET, -- To prevent duplicate submissions from same device
  user_agent TEXT, -- Additional tracking
  UNIQUE(session_id, student_name) -- Prevent duplicate names in same session
);

-- Step 6: Enable Row Level Security (RLS) if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'attendance_sessions' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'attendance_records' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Step 7: Create RLS Policies for user_profiles (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 8: Create RLS Policies for attendance_sessions (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Lecturers can manage their sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Anyone can view active sessions" ON attendance_sessions;

CREATE POLICY "Lecturers can manage their sessions" ON attendance_sessions FOR ALL USING (auth.uid() = lecturer_id);
CREATE POLICY "Anyone can view active sessions" ON attendance_sessions FOR SELECT USING (is_active = true);

-- Step 9: Create RLS Policies for attendance_records (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can mark attendance" ON attendance_records;
DROP POLICY IF EXISTS "Lecturers can view attendance for their sessions" ON attendance_records;

CREATE POLICY "Anyone can mark attendance" ON attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Lecturers can view attendance for their sessions" ON attendance_records FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM attendance_sessions 
    WHERE attendance_sessions.id = attendance_records.session_id 
    AND attendance_sessions.lecturer_id = auth.uid()
  )
);

-- Step 10: Create or replace function to calculate late status
CREATE OR REPLACE FUNCTION calculate_late_status()
RETURNS TRIGGER AS $$
DECLARE
  session_start_time TIME;
  session_date DATE;
  class_start_datetime TIMESTAMP WITH TIME ZONE;
  late_threshold_datetime TIMESTAMP WITH TIME ZONE;
  minutes_late INTEGER;
BEGIN
  -- Get session start time and date with proper table qualification
  SELECT attendance_sessions.start_time, attendance_sessions.session_date 
  INTO session_start_time, session_date
  FROM attendance_sessions 
  WHERE attendance_sessions.id = NEW.session_id;
  
  -- Create full datetime for class start
  class_start_datetime := (session_date::TEXT || ' ' || session_start_time::TEXT)::TIMESTAMP WITH TIME ZONE;
  
  -- Calculate late threshold (15 minutes after start)
  late_threshold_datetime := class_start_datetime + INTERVAL '15 minutes';
  
  -- Calculate how many minutes late (if any)
  IF NEW.marked_at > late_threshold_datetime THEN
    minutes_late := EXTRACT(EPOCH FROM (NEW.marked_at - class_start_datetime)) / 60;
    NEW.is_late := true;
    NEW.late_by_minutes := minutes_late;
  ELSE
    NEW.is_late := false;
    NEW.late_by_minutes := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create trigger for late status calculation (drop existing first)
DROP TRIGGER IF EXISTS calculate_late_status_trigger ON attendance_records;
CREATE TRIGGER calculate_late_status_trigger
  BEFORE INSERT ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_late_status();

-- Step 12: Create or replace function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    COALESCE(new.raw_user_meta_data->>'role', 'lecturer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Create trigger for new user registration (drop existing first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 14: Fix any existing foreign key references if migrating from profiles
DO $$
BEGIN
    -- Update foreign key constraint name if it was created with the old table name
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_sessions_lecturer_id_fkey' 
        AND table_name = 'attendance_sessions'
    ) THEN
        -- The constraint should automatically reference user_profiles now
        RAISE NOTICE 'Foreign key constraints updated automatically';
    END IF;
END $$;

-- Verification queries (run these to verify setup)
SELECT 
    'user_profiles' as table_name, 
    count(*) as count,
    'Table exists and accessible' as status
FROM user_profiles
UNION ALL
SELECT 
    'attendance_sessions' as table_name, 
    count(*) as count,
    'Table exists and accessible' as status
FROM attendance_sessions
UNION ALL
SELECT 
    'attendance_records' as table_name, 
    count(*) as count,
    'Table exists and accessible' as status
FROM attendance_records;

-- Show RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'attendance_sessions', 'attendance_records')
ORDER BY tablename; 