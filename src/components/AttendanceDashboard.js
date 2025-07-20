import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Download, Users, Check, X, Clock, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react'

export default function AttendanceDashboard() {
  const [students, setStudents] = useState(() => {
    const savedStudents = localStorage.getItem('students');
    return savedStudents ? JSON.parse(savedStudents) : [];
  })
  const [absenceNotifications, setAbsenceNotifications] = useState([])

  const [showAttendanceMode, setShowAttendanceMode] = useState(false)
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

  // Calculate stats
  const totalStudents = students.length
  const averageAttendance = Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / totalStudents)
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
      {/* Absence Notifications */}
        {absenceNotifications.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Recent Absences
            </h2>
            <div className="grid gap-4">
              <AnimatePresence>
                {absenceNotifications.map((notification) => {
                  const risk = getRiskLevel(notification.consecutiveAbsences)
                  return (
                    <motion.div
                      key={notification.studentId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-semibold">
                                    {notification.studentName.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{notification.studentName}</p>
                                  <p className="text-sm text-gray-600">Roll No: {notification.rollNumber}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">{getDaysAgoText(notification.daysSinceAbsent)}</p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${risk.color}`}>
                                {risk.level}
                              </span>
                            </div>
                          </div>
                          {notification.consecutiveAbsences > 1 && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-800">
                                ⚠️ {notification.consecutiveAbsences} consecutive absences
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
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
                  {students.map((student) => (
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

        {/* Attendance Mode Modal */}
        <AnimatePresence>
          {showAttendanceMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowAttendanceMode(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Attendance Mode</h2>
                  <p className="text-gray-600 mb-6">
                    The attendance marking system is coming soon. This feature will allow you to mark student attendance with swipe gestures.
                  </p>
                  <Button 
                    onClick={() => setShowAttendanceMode(false)}
                    className="w-full"
                  >
                    Got it
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}