-- Update the late threshold from 10 minutes to 15 minutes
-- Run this in your Supabase SQL Editor

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
  
  -- Calculate late threshold (15 minutes after start - updated from 10)
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