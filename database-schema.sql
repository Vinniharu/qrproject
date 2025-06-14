-- QR Attendance System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (lecturers only)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'lecturer' CHECK (role = 'lecturer'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create attendance_sessions table
CREATE TABLE attendance_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lecturer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- Create attendance_records table (no student authentication required)
CREATE TABLE attendance_records (
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

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for attendance_sessions
CREATE POLICY "Lecturers can manage their sessions" ON attendance_sessions FOR ALL USING (auth.uid() = lecturer_id);
CREATE POLICY "Anyone can view active sessions" ON attendance_sessions FOR SELECT USING (is_active = true);

-- Policies for attendance_records
CREATE POLICY "Anyone can mark attendance" ON attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Lecturers can view attendance for their sessions" ON attendance_records FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM attendance_sessions 
    WHERE attendance_sessions.id = attendance_records.session_id 
    AND attendance_sessions.lecturer_id = auth.uid()
  )
);

-- Function to automatically calculate late status
CREATE OR REPLACE FUNCTION calculate_late_status()
RETURNS TRIGGER AS $$
DECLARE
  session_start_time TIME;
  session_date DATE;
  class_start_datetime TIMESTAMP WITH TIME ZONE;
  late_threshold_datetime TIMESTAMP WITH TIME ZONE;
  minutes_late INTEGER;
BEGIN
  -- Get session start time and date
  SELECT start_time, session_date INTO session_start_time, session_date
  FROM attendance_sessions 
  WHERE id = NEW.session_id;
  
  -- Create full datetime for class start
  class_start_datetime := (session_date::TEXT || ' ' || session_start_time::TEXT)::TIMESTAMP WITH TIME ZONE;
  
  -- Calculate late threshold (10 minutes after start)
  late_threshold_datetime := class_start_datetime + INTERVAL '10 minutes';
  
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

-- Trigger to automatically calculate late status
CREATE TRIGGER calculate_late_status_trigger
  BEFORE INSERT ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_late_status();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    COALESCE(new.raw_user_meta_data->>'role', 'lecturer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 