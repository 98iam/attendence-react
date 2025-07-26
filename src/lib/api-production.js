import { supabase } from './supabase'

// Student Management Functions
export const studentAPI = {
  // Get all students
  async getAll() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('roll_number', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Create a new student
  async create(studentData) {
    const insertData = {
      name: studentData.name,
      roll_number: studentData.rollNumber,
      phone: studentData.phone || null,
      email: studentData.email || null
    }
    
    const { data, error } = await supabase
      .from('students')
      .insert([insertData])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create student: ${error.message}`)
    }
    
    return data
  },

  // Update a student
  async update(id, studentData) {
    const { data, error } = await supabase
      .from('students')
      .update({
        name: studentData.name,
        roll_number: studentData.rollNumber,
        phone: studentData.phone || null,
        email: studentData.email || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a student
  async delete(id) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Update student attendance stats
  async updateAttendanceStats(studentId, totalClasses, presentClasses, attendancePercentage, consecutiveAbsences = 0) {
    const { data, error } = await supabase
      .from('students')
      .update({
        total_classes: totalClasses,
        present_classes: presentClasses,
        attendance_percentage: attendancePercentage,
        consecutive_absences: consecutiveAbsences,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Attendance Records Functions
export const attendanceAPI = {
  // Get all attendance records
  async getAll() {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        students (
          name,
          roll_number
        )
      `)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get attendance records for a specific date
  async getByDate(date) {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        students (
          name,
          roll_number
        )
      `)
      .eq('date', date)
      .order('students(roll_number)', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Create attendance records for a date
  async createBatch(attendanceRecords) {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert(attendanceRecords)
      .select()
    
    if (error) throw error
    return data
  },

  // Get attendance records for a specific student
  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

// Combined functions for attendance operations
export const attendanceOperations = {
  // Take attendance for all students (only once per day)
  async takeAttendance(attendanceData) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // First, check if attendance has already been taken today
      const { data: existingRecords, error: checkError } = await supabase
        .from('attendance_records')
        .select('student_id')
        .eq('date', today)
      
      if (checkError) {
        throw new Error(`Failed to check existing attendance: ${checkError.message}`)
      }
      
      // If there are existing records for today, prevent duplicate attendance
      if (existingRecords && existingRecords.length > 0) {
        const existingStudentIds = existingRecords.map(record => record.student_id)
        const duplicateStudents = Object.keys(attendanceData).filter(studentId => 
          existingStudentIds.includes(studentId)
        )
        
        if (duplicateStudents.length > 0) {
          throw new Error(`Attendance has already been taken today for ${duplicateStudents.length} student(s). Only one attendance per day is allowed.`)
        }
      }
      
      // Prepare attendance records
      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: studentId,
        date: today,
        status: status
      }))
      
      // Insert attendance records
      await attendanceAPI.createBatch(attendanceRecords)
      
      // Update student statistics - but only calculate from actual unique dates
      const students = await studentAPI.getAll()
      
      for (const [studentId] of Object.entries(attendanceData)) {
        const student = students.find(s => s.id === studentId)
        if (student) {
          // Get all attendance records for this student to calculate accurate stats
          const { data: studentRecords, error: recordsError } = await supabase
            .from('attendance_records')
            .select('date, status')
            .eq('student_id', studentId)
          
          if (recordsError) {
            continue
          }
          
          // Group by date to handle any existing duplicates and count unique dates only
          const uniqueDates = {}
          studentRecords.forEach(record => {
            // For each date, if there are multiple records, prioritize 'present' over 'absent'
            if (!uniqueDates[record.date] || record.status === 'present') {
              uniqueDates[record.date] = record.status
            }
          })
          
          const totalUniqueDays = Object.keys(uniqueDates).length
          const presentDays = Object.values(uniqueDates).filter(status => status === 'present').length
          const attendancePercentage = totalUniqueDays > 0 ? Math.round((presentDays / totalUniqueDays) * 100) : 0
          
          // Calculate consecutive absences
          const sortedDates = Object.keys(uniqueDates).sort().reverse() // Most recent first
          let consecutiveAbsences = 0
          for (const date of sortedDates) {
            if (uniqueDates[date] === 'absent') {
              consecutiveAbsences++
            } else {
              break // Stop counting when we hit a present day
            }
          }
          
          await studentAPI.updateAttendanceStats(
            studentId,
            totalUniqueDays,
            presentDays,
            attendancePercentage,
            consecutiveAbsences
          )
        }
      }
      
      return true
    } catch (error) {
      throw error
    }
  },

  // Get students with absence alerts
  async getAbsenceAlerts() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .gt('consecutive_absences', 0)
      .order('roll_number', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}