-- Assign batches to students in Semester 2, Section B
-- Distribute them into B1, B2, B3 based on roll number

-- Batch B1 (First 20 students)
UPDATE students
SET batch = 'B1'
WHERE semester = 2 
  AND section = 'B'
  AND roll_number IN (
    SELECT roll_number FROM students 
    WHERE semester = 2 AND section = 'B' 
    ORDER BY roll_number 
    LIMIT 20
  );

-- Batch B2 (Next 20 students)
UPDATE students
SET batch = 'B2'
WHERE semester = 2 
  AND section = 'B'
  AND batch IS NULL
  AND roll_number IN (
    SELECT roll_number FROM students 
    WHERE semester = 2 AND section = 'B' AND batch IS NULL
    ORDER BY roll_number 
    LIMIT 20
  );

-- Batch B3 (Remaining students)
UPDATE students
SET batch = 'B3'
WHERE semester = 2 
  AND section = 'B'
  AND batch IS NULL;
