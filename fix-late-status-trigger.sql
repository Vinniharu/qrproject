-- Fix for ambiguous column reference in calculate_late_status trigger
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS calculate_late_status_trigger ON attendance_records;
DROP FUNCTION IF EXISTS calculate_late_status();

-- Create the corrected function with proper column qualification
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
  
  -- Calculate late threshold (15 minutes after start to match the API logic)
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

-- Recreate the trigger
CREATE TRIGGER calculate_late_status_trigger
  BEFORE INSERT ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_late_status(); 