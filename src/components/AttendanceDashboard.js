import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Download, Users, Check, X, Clock, AlertCircle, TrendingUp, ChevronRight, RotateCcw, ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
import { studentAPI, attendanceOperations } from '../lib/api'

export default function AttendanceDashboard() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
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

  // Load students from Supabase
  useEffect(() => {
    loadStudents()
  }, [])

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
        attendancePercentage: student.attendance_percentage || 0,
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

  // Load absence alerts
  useEffect(() => {
    loadAbsenceAlerts()
  }, [])

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

  // Calculate stats
  const totalStudents = students.length
  const averageAttendance = totalStudents > 0 ? Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / totalStudents) : 0
  const studentsNeedingAttention = students.filter(s => s.attendancePercentage < 80).length



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

  const saveAttendanceData = async () => {
    try {
      setLoading(true)

      // Use the attendance operations API to save to Supabase
      await attendanceOperations.takeAttendance(attendance)

      // Reload students and absence alerts to get updated data
      await loadStudents()
      await loadAbsenceAlerts()

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
    setDragState({ isDragging: false, deltaY: 0, startY: 0 })
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
              <p className="text-xs md:text-sm text-gray-600 mt-1">{today}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={startAttendanceMode}
                className="bg-green-600 hover:bg-green-700"
                disabled={students.length === 0}
                size="sm"
              >
                <Check className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Take Attendance</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Loading dashboard data...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-blue-800">Total Students</p>
                      <p className="text-lg md:text-2xl font-bold text-blue-900">{totalStudents}</p>
                    </div>
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-green-800">Avg. Attendance</p>
                      <p className="text-lg md:text-2xl font-bold text-green-900">{averageAttendance}%</p>
                    </div>
                    <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2 md:col-span-1 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-orange-800">Need Attention</p>
                      <p className="text-lg md:text-2xl font-bold text-orange-900">{studentsNeedingAttention}</p>
                    </div>
                    <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid - Class Overview and Absence Alerts Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Class Overview - Takes 2/3 of the space */}
              <div className="lg:col-span-2">
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
                                      className={`h-2 rounded-full ${student.attendancePercentage >= 90 ? 'bg-green-500' :
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
                            <span className="text-sm">Excellent (90%+)</span>
                            <span className="font-semibold text-green-700">
                              {students.filter(s => s.attendancePercentage >= 90).length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <span className="text-sm">Good (80-89%)</span>
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
              </div>

              {/* Absence Alerts - Takes 1/3 of the space */}
              <div className="lg:col-span-1">
                {absenceNotifications.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Absence Alerts
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {absenceNotifications.length} student{absenceNotifications.length !== 1 ? 's' : ''} need attention
                      </p>
                    </CardHeader>
                    <CardContent>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-200">
                          <div className="text-lg font-bold text-yellow-700">
                            {absenceNotifications.filter(n => n.consecutiveAbsences === 1).length}
                          </div>
                          <div className="text-xs text-yellow-600">1 Day</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
                          <div className="text-lg font-bold text-orange-700">
                            {absenceNotifications.filter(n => n.consecutiveAbsences === 2).length}
                          </div>
                          <div className="text-xs text-orange-600">2 Days</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                          <div className="text-lg font-bold text-red-700">
                            {absenceNotifications.filter(n => n.consecutiveAbsences >= 3).length}
                          </div>
                          <div className="text-xs text-red-600">3+ Days</div>
                        </div>
                      </div>

                      {/* Compact Student List */}
                      <div className="space-y-2">
                        <AnimatePresence>
                          {absenceNotifications.map((notification, index) => {
                            const risk = getRiskLevel(notification.consecutiveAbsences)
                            return (
                              <motion.div
                                key={notification.studentId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-3 rounded-lg border ${notification.consecutiveAbsences >= 3 ? 'bg-red-50 border-red-200' :
                                  notification.consecutiveAbsences >= 2 ? 'bg-orange-50 border-orange-200' :
                                    'bg-yellow-50 border-yellow-200'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${notification.consecutiveAbsences >= 3 ? 'bg-red-500' :
                                      notification.consecutiveAbsences >= 2 ? 'bg-orange-500' :
                                        'bg-yellow-500'
                                      }`}>
                                      {notification.rollNumber}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{notification.studentName}</p>
                                    </div>
                                  </div>
                                  <div className={`text-lg font-bold ${notification.consecutiveAbsences >= 3 ? 'text-red-700' :
                                    notification.consecutiveAbsences >= 2 ? 'text-orange-700' :
                                      'text-yellow-700'
                                    }`}>
                                    {notification.consecutiveAbsences}
                                  </div>
                                </div>
                                <div className="text-xs">
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${risk.color}`}>
                                    {risk.level}
                                  </span>
                                  <p className={`mt-1 ${notification.consecutiveAbsences >= 3 ? 'text-red-600' :
                                    notification.consecutiveAbsences >= 2 ? 'text-orange-600' :
                                      'text-yellow-600'
                                    }`}>
                                    {notification.consecutiveAbsences >= 3 ? '📞 Contact parent' :
                                      notification.consecutiveAbsences >= 2 ? '⚠️ Follow up' :
                                        '👀 Monitor closely'}
                                  </p>
                                </div>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                      </div>

                      {/* Footer Note */}
                      <div className="mt-4 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-800">
                          <strong>Note:</strong> Alerts clear when students are marked present.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        All Clear
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6">
                        <div className="text-4xl mb-2">✅</div>
                        <p className="text-sm text-gray-600">No absence alerts</p>
                        <p className="text-xs text-gray-500 mt-1">All students have good attendance</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

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
                    initial={{ y: '100vh' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100vh' }}
                    className="bg-white rounded-t-lg md:rounded-lg p-6 max-w-2xl w-full h-full md:h-auto md:max-h-[80vh] overflow-y-auto"
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
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${result.status === 'present'
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
                  initial={{ y: '100vh' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100vh' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed inset-0 bg-gray-100 z-50 flex flex-col"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    userSelect: 'none'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 bg-white shadow-sm">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">Mark Attendance</h2>
                      <p className="text-sm text-gray-600">
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
                  <div className="px-4 py-3 bg-white border-b">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${((students.length - swipeStudents.length) / students.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
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
                              cursor: isTopCard ? (dragState.isDragging ? 'grabbing' : 'grab') : 'default',
                              touchAction: 'none'
                            };

                            return (
                              <motion.div
                                key={student.id}
                                className="absolute inset-0 bg-white rounded-3xl shadow-lg overflow-hidden"
                                style={cardStyle}
                                onPointerDown={isTopCard ? handlePointerDown : undefined}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{
                                  y: (swipeStudents.length - 1 - index) * 10 + (isTopCard ? dragState.deltaY : 0),
                                  scale: 1 - (swipeStudents.length - 1 - index) * 0.05,
                                  opacity: 1
                                }}
                                exit={{ y: -50, opacity: 0 }}
                                transition={{
                                  type: dragState.isDragging && isTopCard ? 'tween' : 'spring',
                                  stiffness: 300,
                                  damping: 30,
                                  duration: dragState.isDragging && isTopCard ? 0 : 0.3
                                }}
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
                              </motion.div>
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
          </>
        )}
      </div>
    </div>
  )
}