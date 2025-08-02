import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Calendar, ChevronLeft, ChevronRight, Download, Filter, Search, Check, X, Loader2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { studentAPI, attendanceAPI } from '../lib/api-production'

export default function AttendanceHistory() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedStudent, setSelectedStudent] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('calendar')
  const [showArchivedHistory, setShowArchivedHistory] = useState(false)

  // Real data from Supabase
  const [students, setStudents] = useState([])
  const [archivedStudents, setArchivedStudents] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [archivedAttendanceRecords, setArchivedAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)

  // Load data from Supabase
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (showArchivedHistory) {
        // Load archived students and their records
        const [archivedStudentsData, allRecordsData] = await Promise.all([
          studentAPI.getArchived(), // Only archived students
          attendanceAPI.getAll()
        ])
        
        // Transform archived students data
        const transformedArchivedStudents = archivedStudentsData.map(student => ({
          id: student.id,
          name: student.name,
          rollNumber: student.roll_number,
          phone: student.phone || '',
          email: student.email || '',
          attendancePercentage: parseFloat((student.attendance_percentage || 0).toFixed(2)),
          totalClasses: student.total_classes || 0,
          presentClasses: student.present_classes || 0,
          consecutiveAbsences: student.consecutive_absences || 0,
          isActive: false,
          archivedAt: student.archived_at,
          archivedReason: student.archived_reason,
          createdAt: student.created_at
        }))
        
        // Transform attendance records for archived students only
        const archivedStudentIds = transformedArchivedStudents.map(s => s.id)
        const transformedArchivedRecords = allRecordsData
          .filter(record => archivedStudentIds.includes(record.student_id))
          .map(record => ({
            date: record.date,
            status: record.status,
            studentId: record.student_id,
            studentName: record.students?.name || '',
            rollNumber: record.students?.roll_number || ''
          }))
        
        setArchivedStudents(transformedArchivedStudents)
        setArchivedAttendanceRecords(transformedArchivedRecords)
        setStudents([]) // Clear active students when viewing archived
        setAttendanceRecords([]) // Clear active records when viewing archived
        
      } else {
        // Load active students and their records (normal mode)
        const [studentsData, recordsData] = await Promise.all([
          studentAPI.getAll(false), // false = only active students for regular history
          attendanceAPI.getAll()
        ])
        
        // Transform students data
        const transformedStudents = studentsData.map(student => ({
          id: student.id,
          name: student.name,
          rollNumber: student.roll_number,
          phone: student.phone || '',
          email: student.email || '',
          attendancePercentage: parseFloat((student.attendance_percentage || 0).toFixed(2)),
          totalClasses: student.total_classes || 0,
          presentClasses: student.present_classes || 0,
          consecutiveAbsences: student.consecutive_absences || 0,
          isActive: student.is_active !== undefined ? student.is_active : true,
          archivedAt: student.archived_at,
          archivedReason: student.archived_reason,
          createdAt: student.created_at // Important for filtering attendance by join date
        }))
        
        // Transform attendance records data - only for active students
        const activeStudentIds = transformedStudents.map(s => s.id)
        const transformedRecords = recordsData
          .filter(record => activeStudentIds.includes(record.student_id))
          .map(record => {
            return {
              date: record.date,
              status: record.status,
              studentId: record.student_id,
              studentName: record.students?.name || '',
              rollNumber: record.students?.roll_number || ''
            }
          })
        
        setStudents(transformedStudents)
        setAttendanceRecords(transformedRecords)
        setArchivedStudents([]) // Clear archived students when viewing active
        setArchivedAttendanceRecords([]) // Clear archived records when viewing active
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Reload data when showArchivedHistory changes
  useEffect(() => {
    loadData()
  }, [showArchivedHistory])

  // Listen for custom events when attendance is taken
  useEffect(() => {
    const handleAttendanceUpdate = () => {
      loadData()
    }

    window.addEventListener('attendanceUpdated', handleAttendanceUpdate)

    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate)
    }
  }, [])

  // Sort students by roll number for consistent ordering
  const sortedStudents = useMemo(() => {
    const currentStudents = showArchivedHistory ? archivedStudents : students
    return [...currentStudents].sort((a, b) => {
      // Convert roll numbers to numbers for proper sorting
      const rollA = parseInt(a.rollNumber) || 0;
      const rollB = parseInt(b.rollNumber) || 0;
      return rollA - rollB;
    });
  }, [students, archivedStudents, showArchivedHistory])

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
    const currentRecords = showArchivedHistory ? archivedAttendanceRecords : attendanceRecords
    const records = currentRecords.filter(
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

  // Listen for attendance completion to refresh data
  useEffect(() => {
    const handleAttendanceComplete = () => {
      loadData()
    }

    window.addEventListener('attendanceComplete', handleAttendanceComplete)

    return () => {
      window.removeEventListener('attendanceComplete', handleAttendanceComplete)
    }
  }, [])

  const exportData = () => {
    // Export functionality would go here
    // Export functionality would be implemented here
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Attendance History
                {showArchivedHistory && (
                  <span className="text-orange-600"> - Archived Students</span>
                )}
              </h1>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                {showArchivedHistory 
                  ? `Viewing ${archivedStudents.length} archived students (rarely used)`
                  : `Viewing ${students.length} active students`
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={!showArchivedHistory ? 'default' : 'outline'}
                onClick={() => setShowArchivedHistory(false)}
                size="sm"
              >
                <span className="hidden md:inline">Active Students</span>
                <span className="md:hidden">Active</span>
              </Button>
              <Button
                variant={showArchivedHistory ? 'default' : 'outline'}
                onClick={() => setShowArchivedHistory(true)}
                size="sm"
                className="text-orange-600 hover:text-orange-700 border-orange-200"
              >
                <span className="hidden md:inline">Archived History</span>
                <span className="md:hidden">Archived</span>
              </Button>
              <div className="border-l border-gray-300 mx-2"></div>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendar')}
                size="sm"
              >
                <Calendar className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Calendar</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                size="sm"
              >
                <Filter className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">List View</span>
              </Button>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="student-select" className="text-sm font-medium text-gray-700 mb-1 block">Student</label>
                <select
                  id="student-select"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Students</option>
                  {sortedStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.rollNumber})
                      {!showArchivedHistory && !student.isActive ? ' [ARCHIVED]' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="search-input" className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search student..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Loading attendance data...</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'calendar' ? (
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
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="bg-gray-50 p-2 text-center font-medium text-gray-700">
                    {day}
                  </div>
                ))}
                {Array.from({ length: monthDays[0].getDay() }).map((_, index) => (
                  <div key={`empty-${index}`} className="bg-white p-1" />
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
                      className={`${dayBackgroundClass} p-1 min-h-16 md:min-h-20 relative ${!isSameMonth(day, currentDate) ? 'text-gray-400' : ''
                        } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="font-medium mb-1">{format(day, 'd')}</div>
                      {summary && (
                        <div className="space-y-1">
                          {summary.singleStudent ? (
                            // Single student view - show large status indicator
                            <div className="flex flex-col items-center justify-center h-10">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${summary.status === 'present' ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                {summary.status === 'present' ? (
                                  <Check className="h-3 w-3 text-white" />
                                ) : (
                                  <X className="h-3 w-3 text-white" />
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
                {(() => {
                  const currentRecords = showArchivedHistory ? archivedAttendanceRecords : attendanceRecords
                  const currentStudentsList = showArchivedHistory ? archivedStudents : students
                  
                  return currentRecords
                    .filter(record => selectedStudent === 'all' || record.studentId === selectedStudent)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => {
                      const student = currentStudentsList.find(s => s.id === record.studentId)
                      const isArchived = showArchivedHistory || (student && !student.isActive)
                      
                      return (
                        <div key={`${record.date}-${record.studentId}`} className={`flex items-center justify-between p-3 border rounded-lg ${isArchived ? 'bg-orange-50 border-orange-200' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isArchived ? 'bg-orange-200' : 'bg-gray-200'}`}>
                              <span className="text-sm font-semibold">
                                {record.studentName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{record.studentName}</p>
                                {isArchived && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                    ARCHIVED
                                  </span>
                                )}
                              </div>
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
                      )
                    })
                })()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}