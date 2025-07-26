import { useState, useCallback } from 'react'
import { attendanceOperations } from '../../../lib/api-production'

export const useAttendance = (students) => {
  const [showAttendanceMode, setShowAttendanceMode] = useState(false)
  const [swipeStudents, setSwipeStudents] = useState([])
  const [history, setHistory] = useState([])
  const [attendance, setAttendance] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [attendanceResults, setAttendanceResults] = useState([])
  const [loading, setLoading] = useState(false)

  const startAttendanceMode = useCallback(() => {
    // Sort students by roll number before starting attendance (ascending order)
    const sortedStudents = [...students].sort((a, b) => {
      const rollA = parseInt(a.rollNumber, 10) || 0;
      const rollB = parseInt(b.rollNumber, 10) || 0;
      return rollA - rollB;
    });
    setSwipeStudents(sortedStudents);
    setHistory([]);
    setAttendance({});
    setShowAttendanceMode(true);
  }, [students])

  const handleSwipe = useCallback((status) => {
    if (swipeStudents.length === 0) return;

    setSwipeStudents(prev => {
      const newStudents = [...prev];
      const swipedStudent = newStudents.shift(); // Get first student (lowest roll number)

      setHistory(prevHistory => [...prevHistory, swipedStudent]);
      setAttendance(prevAttendance => ({
        ...prevAttendance,
        [swipedStudent.id]: status
      }));

      return newStudents;
    });
  }, [swipeStudents.length]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    setHistory(prev => {
      const newHistory = [...prev];
      const lastStudent = newHistory.pop();

      setSwipeStudents(prevStudents => [lastStudent, ...prevStudents]); // Add back to beginning
      setAttendance(prev => {
        const newAttendance = { ...prev };
        delete newAttendance[lastStudent.id];
        return newAttendance;
      });

      return newHistory;
    });
  }, [history.length]);

  const saveAttendanceData = async () => {
    try {
      setLoading(true)
      await attendanceOperations.takeAttendance(attendance)
      
      // Dispatch custom events to notify other components
      window.dispatchEvent(new CustomEvent('attendanceUpdated'))
      window.dispatchEvent(new CustomEvent('attendanceComplete', {
        detail: {
          date: new Date().toISOString().split('T')[0]
        }
      }))
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Failed to save attendance. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const closeAttendanceMode = () => {
    if (Object.keys(attendance).length > 0) {
      // Prepare results data sorted by roll number
      const results = Object.entries(attendance)
        .map(([studentId, status]) => {
          const student = students.find(s => s.id === studentId)
          return {
            studentId,
            studentName: student?.name || '',
            rollNumber: student?.rollNumber || '',
            status
          }
        })
        .sort((a, b) => {
          const rollA = parseInt(a.rollNumber) || 0
          const rollB = parseInt(b.rollNumber) || 0
          return rollA - rollB
        })

      setAttendanceResults(results)
      saveAttendanceData()
      setShowResults(true)
    }
    setShowAttendanceMode(false)
    setSwipeStudents([])
    setHistory([])
    setAttendance({})
  }

  return {
    showAttendanceMode,
    swipeStudents,
    history,
    attendance,
    showResults,
    attendanceResults,
    loading,
    startAttendanceMode,
    handleSwipe,
    handleUndo,
    closeAttendanceMode,
    setShowResults
  }
}