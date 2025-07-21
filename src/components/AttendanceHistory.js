import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Download, Filter, Search, User, Clock, Check, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

export default function AttendanceHistory() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedStudent, setSelectedStudent] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('calendar')
  const [showTodayResults, setShowTodayResults] = useState(false)

  // Real data from localStorage
  const [students, setStudents] = useState(() => {
    const savedStudents = localStorage.getItem('students');
    return savedStudents ? JSON.parse(savedStudents) : [];
  })

  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const savedRecords = localStorage.getItem('attendanceRecords');
    return savedRecords ? JSON.parse(savedRecords) : [];
  })

  // Listen for localStorage changes to sync data
  useEffect(() => {
    const handleStorageChange = () => {
      const savedStudents = localStorage.getItem('students');
      const savedRecords = localStorage.getItem('attendanceRecords');

      if (savedStudents) {
        setStudents(JSON.parse(savedStudents));
      }
      if (savedRecords) {
        setAttendanceRecords(JSON.parse(savedRecords));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events when attendance is taken
    const handleAttendanceUpdate = () => {
      handleStorageChange();
    };

    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
    };
  }, [])

  // Sort students by roll number for consistent ordering
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      // Convert roll numbers to numbers for proper sorting
      const rollA = parseInt(a.rollNumber) || 0;
      const rollB = parseInt(b.rollNumber) || 0;
      return rollA - rollB;
    });
  }, [students])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-500'
      case 'absent': return 'bg-red-500'
      default: return 'bg-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <Check className="h-3 w-3 text-white" />
      case 'absent': return <X className="h-3 w-3 text-white" />
      default: return null
    }
  }

  const getAttendanceForDate = (date, studentId) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const records = attendanceRecords.filter(
      record => record.date === dateStr && (studentId === 'all' || record.studentId === studentId)
    )
    return records
  }

  const getDaySummary = (date) => {
    const records = getAttendanceForDate(date, selectedStudent)
    if (records.length === 0) return null

    // If a specific student is selected, show their individual status
    if (selectedStudent !== 'all') {
      const studentRecord = records.find(r => r.studentId === selectedStudent)
      if (studentRecord) {
        return {
          singleStudent: true,
          status: studentRecord.status,
          studentName: studentRecord.studentName
        }
      }
      return null
    }

    // For all students, show the count summary
    const summary = {
      singleStudent: false,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
    }

    return summary
  }

  const filteredStudents = sortedStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.includes(searchTerm)
  )

  const navigateMonth = (direction) => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  // Get today's attendance results
  const getTodayResults = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendanceRecords.filter(record => record.date === today)

    // Sort by roll number
    return todayRecords.sort((a, b) => {
      const rollA = parseInt(a.rollNumber) || 0
      const rollB = parseInt(b.rollNumber) || 0
      return rollA - rollB
    })
  }

  const todayResults = getTodayResults()
  const todayPresent = todayResults.filter(r => r.status === 'present').length
  const todayAbsent = todayResults.filter(r => r.status === 'absent').length

  // Listen for attendance completion to show results
  useEffect(() => {
    const handleAttendanceComplete = (event) => {
      setShowTodayResults(true)
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowTodayResults(false)
      }, 5000)
    }

    window.addEventListener('attendanceComplete', handleAttendanceComplete)

    return () => {
      window.removeEventListener('attendanceComplete', handleAttendanceComplete)
    }
  }, [])

  const exportData = () => {
    // Export functionality would go here
    console.log('Exporting attendance data...')
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
              <p className="text-sm text-gray-600 mt-1">View and analyze student attendance records</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendar')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <Filter className="h-4 w-4 mr-2" />
                List View
              </Button>
              <Button onClick={exportData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Students</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.rollNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={() => setSearchTerm('')} variant="outline" className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === 'calendar' ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(currentDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
                {Array.from({ length: monthDays[0].getDay() }).map((_, index) => (
                  <div key={`empty-${index}`} className="bg-white p-2" />
                ))}
                {monthDays.map(day => {
                  const summary = getDaySummary(day)
                  const isToday = isSameDay(day, new Date())

                  // For single student view, determine background color
                  let dayBackgroundClass = 'bg-white'
                  if (summary && summary.singleStudent) {
                    dayBackgroundClass = summary.status === 'present' ? 'bg-green-100' : 'bg-red-100'
                  }

                  return (
                    <div
                      key={day.toString()}
                      className={`${dayBackgroundClass} p-2 min-h-20 relative ${!isSameMonth(day, currentDate) ? 'text-gray-400' : ''
                        } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                      {summary && (
                        <div className="space-y-1">
                          {summary.singleStudent ? (
                            // Single student view - show large status indicator
                            <div className="flex flex-col items-center justify-center h-12">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${summary.status === 'present' ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                {summary.status === 'present' ? (
                                  <Check className="h-4 w-4 text-white" />
                                ) : (
                                  <X className="h-4 w-4 text-white" />
                                )}
                              </div>
                              <span className={`text-xs font-medium mt-1 ${summary.status === 'present' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                {summary.status === 'present' ? 'P' : 'A'}
                              </span>
                            </div>
                          ) : (
                            // All students view - show counts
                            <>
                              {summary.present > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                  <span className="text-xs">{summary.present}</span>
                                </div>
                              )}
                              {summary.absent > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                                  <span className="text-xs">{summary.absent}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>Absent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* List View */
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attendanceRecords
                  .filter(record => selectedStudent === 'all' || record.studentId === selectedStudent)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                    <div key={`${record.date}-${record.studentId}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold">
                            {record.studentName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{record.studentName}</p>
                          <p className="text-sm text-gray-600">Roll: {record.rollNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${record.status === 'present' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                          }`}>
                          {getStatusIcon(record.status)}
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}