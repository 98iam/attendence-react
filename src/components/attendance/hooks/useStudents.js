import { useState, useEffect } from 'react'
import { studentAPI, attendanceOperations } from '../../../lib/api-production'

export const useStudents = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [absenceNotifications, setAbsenceNotifications] = useState([])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const data = await studentAPI.getAll()
      // Transform data to match existing component structure
      const transformedData = data.map(student => ({
        id: student.id,
        name: student.name,
        rollNumber: student.roll_number,
        phone: student.phone || '',
        email: student.email || '',
        attendancePercentage: parseFloat((student.attendance_percentage || 0).toFixed(2)),
        totalClasses: student.total_classes || 0,
        presentClasses: student.present_classes || 0,
        consecutiveAbsences: student.consecutive_absences || 0
      }))
      setStudents(transformedData)
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAbsenceAlerts = async () => {
    try {
      const data = await attendanceOperations.getAbsenceAlerts()
      const absentStudents = data.map(student => ({
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.roll_number,
        consecutiveAbsences: student.consecutive_absences,
        daysSinceAbsent: student.consecutive_absences,
      }))
      setAbsenceNotifications(absentStudents)
    } catch (error) {
      console.error('Error loading absence alerts:', error)
    }
  }

  useEffect(() => {
    loadStudents()
    loadAbsenceAlerts()
  }, [])

  // Listen for attendance updates
  useEffect(() => {
    const handleAttendanceUpdate = () => {
      loadStudents()
      loadAbsenceAlerts()
    }

    window.addEventListener('attendanceUpdated', handleAttendanceUpdate)
    return () => window.removeEventListener('attendanceUpdated', handleAttendanceUpdate)
  }, [])

  return {
    students,
    loading,
    absenceNotifications,
    loadStudents,
    loadAbsenceAlerts
  }
}