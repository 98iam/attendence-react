import { supabase } from './supabase'

// Student Management Functions
export const studentAPI = {
  // Get all active students (default behavior)
  async getAll(includeArchived = false) {
    let query = supabase.from('students').select('*')
    
    // Always filter by is_active if not including archived
    if (!includeArchived) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query.order('roll_number', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Get only archived students
  async getArchived() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', false)
      .order('roll_number', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Create a new student
  async create(studentData) {
    // Validate input data
    if (!studentData.name || !studentData.rollNumber) {
      throw new Error('Name and Roll Number are required')
    }
    
    const insertData = {
      name: studentData.name.trim(),
      roll_number: studentData.rollNumber.trim(),
      phone: studentData.phone ? studentData.phone.trim() : null,
      email: studentData.email ? studentData.email.trim() : null,
      is_active: true // Default to active
    }
    
    const { data, error } = await supabase
      .from('students')
      .insert([insertData])
      .select()
      .single()
    
    if (error) {
      // Provide specific error messages
      if (error.code === '23505') {
        throw new Error(`A student with roll number "${studentData.rollNumber}" already exists`)
      } else if (error.code === '23502') {
        throw new Error('Missing required field. Please fill in all required information.')
      } else {
        throw new Error(`Failed to create student: ${error.message}`)
      }
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

  // Archive a student (soft delete)
  async archive(id, reason = 'Student left the class') {
    const { data, error } = await supabase
      .from('students')
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
        archived_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Restore an archived student
  async restore(id) {
    const { data, error } = await supabase
      .from('students')
      .update({
        is_active: true,
        archived_at: null,
        archived_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Permanently delete a student (use with caution)
  async permanentDelete(id) {
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
  },

  // Monthly transition utilities
  async getMonthlyAttendanceSummary(year, month) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        students (
          id,
          name,
          roll_number,
          is_active
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Verify data preservation after archiving
  async verifyStudentDataPreservation(studentId) {
    try {
      // Get student info (even if archived)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()
      
      if (studentError) throw studentError
      
      // Get all attendance records for this student
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: true })
      
      if (recordsError) throw recordsError
      
      return {
        student: student,
        totalRecords: records.length,
        dateRange: records.length > 0 ? {
          first: records[0].date,
          last: records[records.length - 1].date
        } : null,
        monthlyBreakdown: records.reduce((acc, record) => {
          const month = record.date.substring(0, 7) // YYYY-MM format
          if (!acc[month]) {
            acc[month] = { present: 0, absent: 0, total: 0 }
          }
          acc[month][record.status]++
          acc[month].total++
          return acc
        }, {}),
        isDataIntact: records.length > 0
      }
    } catch (error) {
      console.error('Error verifying data preservation:', error)
      throw error
    }
  },

  // Bulk archive students with monthly reason
  async bulkArchiveForMonth(studentIds, year, month, customReason = null) {
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })
    const defaultReason = customReason || `End of ${monthName} ${year} - Class transition`
    
    try {
      const results = []
      
      for (const studentId of studentIds) {
        // Verify student has attendance data before archiving
        const verification = await this.verifyStudentDataPreservation(studentId)
        
        if (verification.isDataIntact) {
          const archivedStudent = await studentAPI.archive(studentId, defaultReason)
          results.push({
            studentId,
            success: true,
            student: archivedStudent,
            dataPreserved: verification.totalRecords,
            monthlyData: verification.monthlyBreakdown
          })
        } else {
          results.push({
            studentId,
            success: false,
            error: 'No attendance data found for student'
          })
        }
      }
      
      return results
    } catch (error) {
      console.error('Error in bulk archive:', error)
      throw error
    }
  }
}