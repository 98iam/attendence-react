-- Attendance System Database Setup
-- Copy and paste this into your Supabase SQL editor

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    attendance_percentage DECIMAL(5,2) DEFAULT 0,
    total_classes INTEGER DEFAULT 0,
    present_classes INTEGER DEFAULT 0,
    consecutive_absences INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);

-- Insert sample students (you can modify these)
INSERT INTO students (name, roll_number, phone, email) VALUES
('John Doe', '001', '1234567890', 'john@example.com'),
('Jane Smith', '002', '1234567891', 'jane@example.com'),
('Mike Johnson', '003', '1234567892', 'mike@example.com'),
('Sarah Wilson', '004', '1234567893', 'sarah@example.com'),
('David Brown', '005', '1234567894', 'david@example.com')
ON CONFLICT (roll_number) DO NOTHING;

-- Function to update attendance statistics
CREATE OR REPLACE FUNCTION update_attendance_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update attendance statistics for the student
    UPDATE students 
    SET 
        total_classes = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE student_id = NEW.student_id
        ),
        present_classes = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE student_id = NEW.student_id AND status = 'present'
        ),
        attendance_percentage = (
            SELECT CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE status = 'present') * 100.0) / COUNT(*), 2)
            END
            FROM attendance_records 
            WHERE student_id = NEW.student_id
        ),
        consecutive_absences = (
            SELECT CASE 
                WHEN NEW.status = 'present' THEN 0
                ELSE COALESCE((
                    SELECT COUNT(*)
                    FROM attendance_records ar
                    WHERE ar.student_id = NEW.student_id 
                    AND ar.date > (
                        SELECT COALESCE(MAX(date), '1900-01-01')
                        FROM attendance_records 
                        WHERE student_id = NEW.student_id AND status = 'present'
                    )
                    AND ar.status = 'absent'
                ), 0) + CASE WHEN NEW.status = 'absent' THEN 1 ELSE 0 END
            END
        ),
        updated_at = NOW()
    WHERE id = NEW.student_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stats
DROP TRIGGER IF EXISTS trigger_update_attendance_stats ON attendance_records;
CREATE TRIGGER trigger_update_attendance_stats
    AFTER INSERT OR UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_stats();

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (you can make this more restrictive later)
CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all operations on attendance_records" ON attendance_records FOR ALL USING (true);