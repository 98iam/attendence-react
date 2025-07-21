import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Download, Users, Check, X, Clock, AlertCircle, TrendingUp, ChevronRight, RotateCcw, ArrowDown, ArrowUp } from 'lucide-react'

export default function AttendanceDashboard() {
  const [students, setStudents] = useState(() => {
    const savedStudents = localStorage.getItem('students');
    return savedStudents ? JSON.parse(savedStudents) : [];
  })
  const [absenceNotifications, setAbsenceNotifications] = useState([])

  const [showAttendanceMode, setShowAttendanceMode] = useState(false)
  const [swipeStudents, setSwipeStudents] = useState([])
  const [history, setHistory] = useState([])
  const [attendance, setAttendance] = useState({})
  const [dragState, setDragState] = useState({
    isDragging: false,
    deltaY: 0,
    startY: 0
  })
  const [showResults, setShowResults] = useState(false)
  const [attendanceResults, setAttendanceResults] = useState([])
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Listen for localStorage changes to sync data
  useEffect(() => {
    const handleStorageChange = () => {
      const savedStudents = localStorage.getItem('students');
      if (savedStudents) {
        setStudents(JSON.parse(savedStudents));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [])

  // Initialize daily absence tracking on app load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastUpdateDate = localStorage.getItem('lastAbsenceUpdate');
    
    // If this is the first time or a new day, set the update date
    if (!lastUpdateDate) {
      localStorage.setItem('lastAbsenceUpdate', today);
    }
  }, [])

  // Update absence notifications and daily counts
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastUpdateDate = localStorage.getItem('lastAbsenceUpdate');
    
    // Check if we need to update daily absence counts (runs once per day)
    if (lastUpdateDate !== today && students.length > 0) {
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      
      const updatedStudents = students.map(student => {
        // Check if student has consecutive absences
        if (student.consecutiveAbsences && student.consecutiveAbsences > 0) {
          // Check if student was marked present today
          const todayRecord = attendanceRecords.find(record => 
            record.date === today && record.studentId === student.id
          );
          
          // If student was marked present today, reset consecutive absences
          if (todayRecord && todayRecord.status === 'present') {
            return {
              ...student,
              consecutiveAbsences: 0,
              lastAbsenceUpdate: today
            };
          }
          
          // If no attendance record for today and it's a new day, increment absence count
          if (!todayRecord && lastUpdateDate && lastUpdateDate < today) {
            return {
              ...student,
              consecutiveAbsences: student.consecutiveAbsences + 1,
              lastAbsenceUpdate: today
            };
          }
        }
        
        return student;
      });
      
      // Update students if there were changes
      const hasChanges = updatedStudents.some((student, index) => 
        student.consecutiveAbsences !== students[index]?.consecutiveAbsences
      );
      
      if (hasChanges) {
        setStudents(updatedStudents);
        localStorage.setItem('students', JSON.stringify(updatedStudents));
      }
      
      // Update the last update date
      localStorage.setItem('lastAbsenceUpdate', today);
    }

    // Create absence notifications sorted by roll number (lowest to highest)
    const absentStudents = students
      .filter(student => student.consecutiveAbsences && student.consecutiveAbsences > 0)
      .map(student => ({
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        consecutiveAbsences: student.consecutiveAbsences,
        daysSinceAbsent: student.consecutiveAbsences,
      }))
      .sort((a, b) => {
        const rollA = parseInt(a.rollNumber) || 0;
        const rollB = parseInt(b.rollNumber) || 0;
        return rollA - rollB;
      });
    
    setAbsenceNotifications(absentStudents);
  }, [students]);

  // Calculate stats
  const totalStudents = students.length
  const averageAttendance = totalStudents > 0 ? Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / totalStudents) : 0
  const studentsNeedingAttention = students.filter(s => s.attendancePercentage < 80).length

  // Test function to add some absent students (for testing purposes)
  const addTestAbsentStudents = () => {
    const updatedStudents = students.map((student, index) => {
      if (index < 2) { // Make first 2 students absent for testing
        return {
          ...student,
          consecutiveAbsences: index + 1 // First student: 1 day, second student: 2 days
        }
      }
      return student
    })
    setStudents(updatedStudents)
    localStorage.setItem('students', JSON.stringify(updatedStudents))
  }

  const getDaysAgoText = (days) => {
    if (days === 1) return 'Yesterday'
    if (days === 2) return 'Day before yesterday'
    return `${days} days ago`
  }

  const getRiskLevel = (consecutiveAbsences) => {
    if (consecutiveAbsences >= 3) return { level: 'High Risk', color: 'text-red-600 bg-red-50' }
    if (consecutiveAbsences >= 2) return { level: 'Medium Risk', color: 'text-orange-600 bg-orange-50' }
    return { level: 'Low Risk', color: 'text-yellow-600 bg-yellow-50' }
  }

  const SWIPE_THRESHOLD = 80;

  // Attendance mode functions
  const startAttendanceMode = () => {
    // Sort students by roll number before starting attendance
    const sortedStudents = [...students].sort((a, b) => {
      const rollA = parseInt(a.rollNumber, 10) || 0;
      const rollB = parseInt(b.rollNumber, 10) || 0;
      return rollA - rollB;
    });
    setSwipeStudents(sortedStudents);
    setHistory([]);
    setAttendance({});
    setDragState({ isDragging: false, deltaY: 0, startY: 0 });
    setShowAttendanceMode(true);
  };

  const handleSwipe = useCallback((status) => {
    if (swipeStudents.length === 0) return;

    setSwipeStudents(prev => {
      const newStudents = [...prev];
      const swipedStudent = newStudents.pop();
      
      setHistory(prevHistory => [...prevHistory, swipedStudent]);
      setAttendance(prevAttendance => ({
        ...prevAttendance,
        [swipedStudent.id]: status
      }));
      
      console.log(`Marked ${swipedStudent.name} as ${status}`);
      
      return newStudents;
    });
  }, [swipeStudents.length]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    
    setHistory(prev => {
      const newHistory = [...prev];
      const lastStudent = newHistory.pop();
      
      setSwipeStudents(prevStudents => [...prevStudents, lastStudent]);
      setAttendance(prev => {
        const newAttendance = { ...prev };
        delete newAttendance[lastStudent.id];
        return newAttendance;
      });
      
      return newHistory;
    });
  }, [history.length]);

  const handlePointerDown = (e) => {
    if (swipeStudents.length === 0) return;
    
    setDragState({
      isDragging: true,
      startY: e.clientY,
      deltaY: 0
    });
    e.preventDefault();
  };

  const handlePointerMove = useCallback((e) => {
    if (!dragState.isDragging) return;
    
    const deltaY = e.clientY - dragState.startY;
    setDragState(prev => ({ ...prev, deltaY }));
  }, [dragState.isDragging, dragState.startY]);

  const handlePointerUp = useCallback(() => {
    if (!dragState.isDragging) return;
    
    const { deltaY } = dragState;
    setDragState({ isDragging: false, deltaY: 0, startY: 0 });

    if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
      // Swipe up is present (deltaY is negative)
      // Swipe down is absent (deltaY is positive)
      handleSwipe(deltaY < 0 ? 'present' : 'absent');
    }
  }, [dragState.isDragging, dragState.deltaY, handleSwipe]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [dragState.isDragging, handlePointerMove, handlePointerUp]);

  const saveAttendanceData = () => {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Create attendance records for history (sorted by roll number)
    const newAttendanceRecords = Object.entries(attendance)
      .map(([studentId, status]) => {
        const student = students.find(s => s.id === studentId)
        return {
          date: today,
          status,
          studentId,
          studentName: student?.name || '',
          rollNumber: student?.rollNumber || ''
        }
      })
      .sort((a, b) => {
        const rollA = parseInt(a.rollNumber) || 0
        const rollB = parseInt(b.rollNumber) || 0
        return rollA - rollB
      })
    
    // Save attendance records to localStorage
    const existingRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')
    const updatedRecords = [...existingRecords, ...newAttendanceRecords]
    localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords))
    
    // Update student statistics
    const updatedStudents = students.map(student => {
      const status = attendance[student.id];
      if (status) {
        const newTotalClasses = (student.totalClasses || 0) + 1;
        const newPresentClasses = (student.presentClasses || 0) + (status === 'present' ? 1 : 0);
        const newAttendancePercentage = Math.round((newPresentClasses / newTotalClasses) * 100);

        let consecutiveAbsences = student.consecutiveAbsences || 0;
        if (status === 'absent') {
          consecutiveAbsences++;
        } else {
          consecutiveAbsences = 0;
        }

        return {
          ...student,
          totalClasses: newTotalClasses,
          presentClasses: newPresentClasses,
          attendancePercentage: newAttendancePercentage,
          consecutiveAbsences: consecutiveAbsences,
        };
      }
      return student;
    });
    
    setStudents(updatedStudents)
    localStorage.setItem('students', JSON.stringify(updatedStudents))
    
    // Dispatch custom events to notify other components
    window.dispatchEvent(new CustomEvent('attendanceUpdated'))
    window.dispatchEvent(new CustomEvent('attendanceComplete', { 
      detail: { 
        records: newAttendanceRecords,
        date: today 
      } 
    }))
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
    setDragState({ isDragging: false, deltaY: 0, startY: 0 })
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">{today}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Test button to demonstrate alerts */}
              {students.length > 0 && (
                <Button
                  onClick={addTestAbsentStudents}
                  variant="outline"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Test Alerts
                </Button>
              )}
              <Button
                onClick={startAttendanceMode}
                className="bg-green-600 hover:bg-green-700"
                disabled={students.length === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Take Attendance
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Students</p>
                  <p className="text-2xl font-bold text-blue-900">{totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Average Attendance</p>
                  <p className="text-2xl font-bold text-green-900">{averageAttendance}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Need Attention</p>
                  <p className="text-2xl font-bold text-orange-900">{studentsNeedingAttention}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>  
        {/* Absence Alerts - Table Format */}
        {absenceNotifications.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Absence Alerts ({absenceNotifications.length})
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Students requiring attention
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">
                    {absenceNotifications.filter(n => n.consecutiveAbsences === 1).length}
                  </div>
                  <div className="text-sm text-yellow-600">1 Day</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">
                    {absenceNotifications.filter(n => n.consecutiveAbsences === 2).length}
                  </div>
                  <div className="text-sm text-orange-600">2 Days</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-700">
                    {absenceNotifications.filter(n => n.consecutiveAbsences >= 3).length}
                  </div>
                  <div className="text-sm text-red-600">3+ Days</div>
                </div>
              </div>

              {/* Absence Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700">Roll No.</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Student Name</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Days Absent</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Risk Level</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Action Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {absenceNotifications.map((notification, index) => {
                        const risk = getRiskLevel(notification.consecutiveAbsences)
                        return (
                          <motion.tr
                            key={notification.studentId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              notification.consecutiveAbsences >= 3 ? 'bg-red-25' :
                              notification.consecutiveAbsences >= 2 ? 'bg-orange-25' :
                              'bg-yellow-25'
                            }`}
                          >
                            <td className="p-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                notification.consecutiveAbsences >= 3 ? 'bg-red-500' :
                                notification.consecutiveAbsences >= 2 ? 'bg-orange-500' :
                                'bg-yellow-500'
                              }`}>
                                {notification.rollNumber}
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-semibold text-gray-900">{notification.studentName}</p>
                                <p className="text-sm text-gray-600">Roll: {notification.rollNumber}</p>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                                notification.consecutiveAbsences >= 3 ? 'bg-red-100 text-red-700' :
                                notification.consecutiveAbsences >= 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {notification.consecutiveAbsences}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.consecutiveAbsences === 1 ? 'day' : 'days'}
                              </p>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${risk.color}`}>
                                {risk.level}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                {notification.consecutiveAbsences >= 3 ? (
                                  <div className="text-red-700 font-medium">
                                    <p>📞 Contact parent/guardian</p>
                                    <p className="text-xs text-red-600 mt-1">Immediate intervention needed</p>
                                  </div>
                                ) : notification.consecutiveAbsences >= 2 ? (
                                  <div className="text-orange-700 font-medium">
                                    <p>⚠️ Follow up with student</p>
                                    <p className="text-xs text-orange-600 mt-1">Check for issues</p>
                                  </div>
                                ) : (
                                  <div className="text-yellow-700 font-medium">
                                    <p>👀 Monitor closely</p>
                                    <p className="text-xs text-yellow-600 mt-1">Will clear when present</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Students will automatically be removed from this list when marked present. 
                  Absence counts increase daily until attendance is taken.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Class Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Attendance Distribution</h3>
                <div className="space-y-2">
                  {[...students]
                    .sort((a, b) => {
                      const rollA = parseInt(a.rollNumber) || 0;
                      const rollB = parseInt(b.rollNumber) || 0;
                      return rollA - rollB;
                    })
                    .map((student) => (
                    <div key={student.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-gray-600">Roll: {student.rollNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              student.attendancePercentage >= 90 ? 'bg-green-500' :
                              student.attendancePercentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${student.attendancePercentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10 text-right">{student.attendancePercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Quick Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Excellent Attendance (90%+)</span>
                    <span className="font-semibold text-green-700">
                      {students.filter(s => s.attendancePercentage >= 90).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm">Good Attendance (80-89%)</span>
                    <span className="font-semibold text-yellow-700">
                      {students.filter(s => s.attendancePercentage >= 80 && s.attendancePercentage < 90).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm">Needs Improvement (&lt;80%)</span>
                    <span className="font-semibold text-red-700">
                      {students.filter(s => s.attendancePercentage < 80).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Results Modal */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowResults(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Results</h2>
                    <p className="text-gray-600">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowResults(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceResults.filter(r => r.status === 'present').length}
                    </div>
                    <div className="text-sm text-green-800">Present</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {attendanceResults.filter(r => r.status === 'absent').length}
                    </div>
                    <div className="text-sm text-red-800">Absent</div>
                  </div>
                </div>

                {/* Student List - Sorted by Roll Number */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Student-wise Attendance (Roll Number Order)</h3>
                  {attendanceResults.map((result, index) => (
                    <motion.div
                      key={result.studentId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold">
                          {result.rollNumber}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{result.studentName}</p>
                          <p className="text-sm text-gray-600">Roll: {result.rollNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          result.status === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.status === 'present' ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {result.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setShowResults(false)}>
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Improved Tinder-Style Attendance Mode */}
        <AnimatePresence>
          {showAttendanceMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-100 z-50 flex flex-col"
              style={{
                fontFamily: 'Poppins, sans-serif',
                userSelect: 'none'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 bg-white shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Mark Attendance</h2>
                  <p className="text-gray-600">
                    {swipeStudents.length === 0 ? 'All Done!' : `${students.length - swipeStudents.length + 1} of ${students.length}`}
                  </p>
                </div>
                <Button
                  onClick={closeAttendanceMode}
                  variant="ghost"
                  className="text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="px-6 py-4 bg-white border-b">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((students.length - swipeStudents.length) / students.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-sm">
                  {/* Card Stack */}
                  <div className="relative h-96 mb-8">
                    {swipeStudents.length === 0 ? (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-lg"
                      >
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <Check size={40} className="text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h3>
                        <p className="text-gray-600">Attendance has been recorded.</p>
                      </motion.div>
                    ) : (
                      swipeStudents.map((student, index) => {
                        const isTopCard = index === swipeStudents.length - 1;
                        const presentOpacity = Math.max(0, -dragState.deltaY / SWIPE_THRESHOLD);
                        const absentOpacity = Math.max(0, dragState.deltaY / SWIPE_THRESHOLD);
                        
                        const cardStyle = {
                          zIndex: index,
                          transform: `scale(${1 - (swipeStudents.length - 1 - index) * 0.05}) translateY(${(swipeStudents.length - 1 - index) * 10}px)${
                            isTopCard && dragState.isDragging ? ` translateY(${dragState.deltaY}px)` : ''
                          }`,
                          transition: dragState.isDragging && isTopCard ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          cursor: isTopCard ? (dragState.isDragging ? 'grabbing' : 'grab') : 'default',
                          touchAction: 'none'
                        };

                        return (
                          <div
                            key={student.id}
                            className="absolute inset-0 bg-white rounded-3xl shadow-lg overflow-hidden"
                            style={cardStyle}
                            onPointerDown={isTopCard ? handlePointerDown : undefined}
                          >
                            {/* Present Feedback Overlay */}
                            <div 
                              className="absolute inset-0 bg-green-500 bg-opacity-70 flex items-center justify-center text-white text-3xl font-bold rounded-3xl"
                              style={{ opacity: isTopCard ? presentOpacity : 0 }}
                            >
                              PRESENT
                            </div>
                            
                            {/* Absent Feedback Overlay */}
                            <div 
                              className="absolute inset-0 bg-red-500 bg-opacity-70 flex items-center justify-center text-white text-3xl font-bold rounded-3xl"
                              style={{ opacity: isTopCard ? absentOpacity : 0 }}
                            >
                              ABSENT
                            </div>
                            
                            {/* Card Content */}
                            <div className="flex flex-col items-center justify-around h-full p-6">
                              <div className="text-center">
                                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                  <span className="text-4xl font-bold text-white">
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">{student.name}</h3>
                                <p className="text-gray-600">Roll No: {student.rollNumber}</p>
                              </div>
                              
                              {/* Swipe Indicators */}
                              <div className="flex flex-col items-center gap-4 w-full">
                                <div className="flex items-center gap-2 text-green-600">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <ArrowUp size={20} />
                                  </div>
                                  <span className="font-semibold text-lg">Present</span>
                                </div>
                                <div className="flex items-center gap-2 text-red-600">
                                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <ArrowDown size={20} />
                                  </div>
                                  <span className="font-semibold text-lg">Absent</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center items-center gap-6">
                    <button 
                      className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-90 transition-transform"
                      onClick={handleUndo}
                      disabled={history.length === 0}
                      title="Undo"
                    >
                      <RotateCcw size={28} className="text-yellow-500" />
                    </button>
                    
                    <button 
                      className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-90 transition-transform"
                      onClick={() => handleSwipe('absent')}
                      disabled={swipeStudents.length === 0}
                      title="Absent (Swipe Down)"
                    >
                      <ArrowDown size={32} className="text-red-500" />
                    </button>
                    
                    <button 
                      className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-90 transition-transform"
                      onClick={() => handleSwipe('present')}
                      disabled={swipeStudents.length === 0}
                      title="Present (Swipe Up)"
                    >
                      <ArrowUp size={32} className="text-green-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {swipeStudents.length > 0 && (
                <div className="p-4 text-center text-gray-600 bg-white border-t">
                  <p className="text-sm">
                    Swipe up for Present, down for Absent, or use the buttons below
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}