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
    console.error('Full error details:', error)
    return { success: false, error: error.message, details: error }
  }
}

// Debug function to check table structure
export const debugTableStructure = async () => {
  try {
    console.log('Checking table structure...')
    
    // Try to get table info
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(0)
    
    if (error) {
      console.error('Table structure check failed:', error)
      return { success: false, error: error.message, details: error }
    }
    
    console.log('Table exists and is accessible')
    return { success: true }
  } catch (err) {
    console.error('Debug error:', err)
    return { success: false, error: err.message }
  }
}

// Test RLS and permissions
export const testRLSPermissions = async () => {
  try {
    console.log('Testing RLS permissions...')
    
    // Test SELECT permission
    const { data: selectData, error: selectError } = await supabase
      .from('students')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.error('SELECT permission failed:', selectError)
      return { success: false, error: `SELECT failed: ${selectError.message}`, details: selectError }
    }
    
    console.log('SELECT permission OK')
    
    // Test INSERT permission with minimal data
    const testData = {
      name: 'RLS Test Student',
      roll_number: 'RLS_TEST_' + Date.now()
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('students')
      .insert([testData])
      .select()
      .single()
    
    if (insertError) {
      console.error('INSERT permission failed:', insertError)
      return { 
        success: false, 
        error: `INSERT failed: ${insertError.message}`, 
        details: insertError,
        hint: insertError.hint || 'Check Row Level Security policies'
      }
    }
    
    console.log('INSERT permission OK, created:', insertData)
    
    // Clean up the test record
    if (insertData?.id) {
      await supabase.from('students').delete().eq('id', insertData.id)
      console.log('Test record cleaned up')
    }
    
    return { success: true, message: 'All permissions working correctly' }
  } catch (err) {
    console.error('RLS test error:', err)
    return { success: false, error: err.message }
  }
}

// Test attendance table and permissions
export const testAttendanceTable = async () => {
  try {
    console.log('Testing attendance_records table...')
    
    // Test if table exists and is accessible
    const { data: selectData, error: selectError } = await supabase
      .from('attendance_records')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.error('Attendance table access failed:', selectError)
      return { 
        success: false, 
        error: `Table access failed: ${selectError.message}`, 
        details: selectError,
        hint: selectError.code === '42P01' ? 'Table does not exist' : 'Check permissions'
      }
    }
    
    console.log('Attendance table accessible')
    
    // Get a test student to use for attendance test
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .limit(1)
    
    if (studentsError || !students || students.length === 0) {
      return { success: false, error: 'No students found for testing' }
    }
    
    // Test INSERT permission with attendance record
    const testAttendanceData = {
      student_id: students[0].id,
      date: new Date().toISOString().split('T')[0],
      status: 'present'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('attendance_records')
      .insert([testAttendanceData])
      .select()
      .single()
    
    if (insertError) {
      console.error('Attendance INSERT failed:', insertError)
      return { 
        success: false, 
        error: `INSERT failed: ${insertError.message}`, 
        details: insertError,
        hint: insertError.hint || 'Check Row Level Security policies for attendance_records table'
      }
    }
    
    console.log('Attendance INSERT OK, created:', insertData)
    
    // Clean up the test record
    if (insertData?.id) {
      await supabase.from('attendance_records').delete().eq('id', insertData.id)
      console.log('Test attendance record cleaned up')
    }
    
    return { success: true, message: 'Attendance table working correctly' }
  } catch (err) {
    console.error('Attendance table test error:', err)
    return { success: false, error: err.message }
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