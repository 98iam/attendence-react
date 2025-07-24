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

// Reset student attendance stats to zero
export const resetStudentAttendance = async (studentId) => {
  try {
    console.log('Resetting attendance for student:', studentId)
    
    // Reset student stats to zero
    const { data, error } = await supabase
      .from('students')
      .update({
        total_classes: 0,
        present_classes: 0,
        attendance_percentage: 0,
        consecutive_absences: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single()
    
    if (error) {
      console.error('Error resetting attendance:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Attendance reset successfully:', data)
    return { success: true, data }
  } catch (err) {
    console.error('Reset error:', err)
    return { success: false, error: err.message }
  }
}

// COMPLETE RESET: Clear all attendance data and start fresh
export const resetAllAttendanceData = async () => {
  try {
    console.log('🔄 Starting complete attendance reset...')
    
    // Step 1: Delete ALL attendance records
    const { error: deleteRecordsError } = await supabase
      .from('attendance_records')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (deleteRecordsError) {
      console.error('Error deleting attendance records:', deleteRecordsError)
      return { success: false, error: `Failed to delete attendance records: ${deleteRecordsError.message}` }
    }
    
    console.log('✅ All attendance records deleted')
    
    // Step 2: Reset ALL student attendance stats to zero
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name')
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return { success: false, error: `Failed to fetch students: ${studentsError.message}` }
    }
    
    if (!students || students.length === 0) {
      return { success: true, message: 'No students found, but attendance records cleared' }
    }
    
    // Reset all students' attendance stats to zero
    const { error: updateError } = await supabase
      .from('students')
      .update({
        total_classes: 0,
        present_classes: 0,
        attendance_percentage: 0,
        consecutive_absences: 0,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all students
    
    if (updateError) {
      console.error('Error resetting student stats:', updateError)
      return { success: false, error: `Failed to reset student stats: ${updateError.message}` }
    }
    
    console.log(`✅ Reset attendance stats for ${students.length} students`)
    
    return {
      success: true,
      message: `🎉 Complete reset successful!`,
      details: {
        attendanceRecordsDeleted: 'All',
        studentsReset: students.length,
        studentsAffected: students.map(s => s.name)
      }
    }
  } catch (err) {
    console.error('Complete reset error:', err)
    return { success: false, error: err.message }
  }
}

// Debug function to check student attendance data
export const debugStudentAttendance = async (studentId) => {
  try {
    console.log('Debugging student attendance for ID:', studentId)
    
    // Get student data
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()
    
    if (studentError) {
      console.error('Error fetching student:', studentError)
      return { success: false, error: studentError.message }
    }
    
    console.log('Student data:', studentData)
    
    // Get attendance records for this student
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
    
    if (attendanceError) {
      console.error('Error fetching attendance records:', attendanceError)
      return { success: false, error: attendanceError.message }
    }
    
    console.log('Attendance records:', attendanceData)
    
    // Check for duplicate dates
    const dateGroups = {}
    attendanceData.forEach(record => {
      if (!dateGroups[record.date]) {
        dateGroups[record.date] = []
      }
      dateGroups[record.date].push(record)
    })
    
    const duplicateDates = Object.entries(dateGroups).filter(([date, records]) => records.length > 1)
    
    console.log('Date groups:', dateGroups)
    console.log('Duplicate dates found:', duplicateDates)
    
    // Calculate actual stats from records
    const totalRecords = attendanceData.length
    const presentRecords = attendanceData.filter(record => record.status === 'present').length
    const actualPercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0
    
    // Calculate unique date stats (removing duplicates)
    const uniqueDates = Object.keys(dateGroups).length
    const uniquePresentDates = Object.values(dateGroups).filter(records => 
      records.some(record => record.status === 'present')
    ).length
    const uniquePercentage = uniqueDates > 0 ? Math.round((uniquePresentDates / uniqueDates) * 100) : 0
    
    console.log('Raw stats:')
    console.log('- Total records:', totalRecords)
    console.log('- Present records:', presentRecords)
    console.log('- Raw percentage:', actualPercentage)
    
    console.log('Unique date stats:')
    console.log('- Unique dates:', uniqueDates)
    console.log('- Present dates:', uniquePresentDates)
    console.log('- Unique percentage:', uniquePercentage)
    
    console.log('Stored stats:')
    console.log('- Stored total_classes:', studentData.total_classes)
    console.log('- Stored present_classes:', studentData.present_classes)
    console.log('- Stored attendance_percentage:', studentData.attendance_percentage)
    
    return {
      success: true,
      studentData,
      attendanceRecords: attendanceData,
      duplicateDates,
      calculatedStats: {
        total: totalRecords,
        present: presentRecords,
        percentage: actualPercentage
      },
      uniqueStats: {
        total: uniqueDates,
        present: uniquePresentDates,
        percentage: uniquePercentage
      },
      storedStats: {
        total: studentData.total_classes || 0,
        present: studentData.present_classes || 0,
        percentage: studentData.attendance_percentage || 0
      }
    }
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
        console.error('Error checking existing attendance:', checkError)
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
      
      for (const [studentId, status] of Object.entries(attendanceData)) {
        const student = students.find(s => s.id === studentId)
        if (student) {
          // Get all attendance records for this student to calculate accurate stats
          const { data: studentRecords, error: recordsError } = await supabase
            .from('attendance_records')
            .select('date, status')
            .eq('student_id', studentId)
          
          if (recordsError) {
            console.error('Error fetching student records:', recordsError)
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