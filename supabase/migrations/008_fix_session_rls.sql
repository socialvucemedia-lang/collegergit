-- Migration 008: Fix Attendance Session RLS
-- PURPOSE: Allow students (and all authenticated users) to view attendance sessions.
-- This is necessary for the student timeline to check if a session exists for a specific slot.

-- Allow read access to attendance_sessions for all authenticated users
CREATE POLICY "Authenticated users can view attendance sessions" ON public.attendance_sessions
    FOR SELECT
    TO authenticated
    USING (true);
