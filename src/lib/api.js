import { supabase } from './supabase'

// Test Supabase connection
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    console.log('Supabase URL:', supabase.supabaseUrl)
    
    // Test basic connection
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Connection test failed:', error)
      return { success: false, error: error.message, details: error }
    }
    
    console.log('Connection test successful, sample data:', data)
    return { success: true, data: data }
  } catch (err) {
    console.error('Connection test error:', err)
    return { success: false, error: err.message }
  }
}

// Test student creation with sample data
export const testStudentCreation = async () => {
  try {
    console.log('Testing student creation...')
    
    const testStudent = {
      name: 'Test Student',
      rollNumber: 'TEST001',
      phone: '1234567890'
    }
    
    const result = await studentAPI.create(testStudent)
    console.log('Test student created successfully:', result)
    
    // Clean up - delete the test student
    await studentAPI.delete(result.id)
    console.log('Test student deleted')
    
    return { success: true, message: 'Student creation test passed' }
  } catch (error) {
    console.error('Student creation test failed:', error)
    return { success: false, error: error.message }
  }
}

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
    console.log('Creating student with data:', studentData)
    
    const insertData = {
      name: studentData.name,
      roll_number: studentData.rollNumber,
      phone: studentData.phone || null,
      email: studentData.email || null
    }
    
    console.log('Insert data:', insertData)
    
    const { data, error } = await supabase
      .from('students')
      .insert([insertData])
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Failed to create student: ${error.message}`)
    }
    
    console.log('Created student:', data)
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
  // Take attendance for all students
  async takeAttendance(attendanceData) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Prepare attendance records
      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: studentId,
        date: today,
        status: status
      }))
      
      // Insert attendance records
      await attendanceAPI.createBatch(attendanceRecords)
      
      // Update student statistics
      const students = await studentAPI.getAll()
      
      for (const [studentId, status] of Object.entries(attendanceData)) {
        const student = students.find(s => s.id === studentId)
        if (student) {
          const newTotalClasses = (student.total_classes || 0) + 1
          const newPresentClasses = (student.present_classes || 0) + (status === 'present' ? 1 : 0)
          const newAttendancePercentage = Math.round((newPresentClasses / newTotalClasses) * 100)
          
          let consecutiveAbsences = student.consecutive_absences || 0
          if (status === 'absent') {
            consecutiveAbsences++
          } else {
            consecutiveAbsences = 0
          }
          
          await studentAPI.updateAttendanceStats(
            studentId,
            newTotalClasses,
            newPresentClasses,
            newAttendancePercentage,
            consecutiveAbsences
          )
        }
      }
      
      return true
    } catch (error) {
      console.error('Error taking attendance:', error)
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