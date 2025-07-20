import { useState, useMemo } from 'react'
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

  // Mock data - in real app, this would come from your backend
  const students = [
    { id: '1', name: 'Alice Johnson', rollNumber: '001', avatar: 'AJ' },
    { id: '2', name: 'Bob Smith', rollNumber: '002', avatar: 'BS' },
    { id: '3', name: 'Charlie Brown', rollNumber: '003', avatar: 'CB' },
    { id: '4', name: 'Diana Prince', rollNumber: '004', avatar: 'DP' },
    { id: '5', name: 'Ethan Hunt', rollNumber: '005', avatar: 'EH' },
    { id: '6', name: 'Fiona Green', rollNumber: '006', avatar: 'FG' },
  ]

  const attendanceRecords = [
    // Alice's records
    { date: '2024-01-15', status: 'present', studentId: '1', studentName: 'Alice Johnson', rollNumber: '001' },
    { date: '2024-01-16', status: 'present', studentId: '1', studentName: 'Alice Johnson', rollNumber: '001' },
    { date: '2024-01-17', status: 'absent', studentId: '1', studentName: 'Alice Johnson', rollNumber: '001' },
    { date: '2024-01-18', status: 'present', studentId: '1', studentName: 'Alice Johnson', rollNumber: '001' },
    { date: '2024-01-19', status: 'late', studentId: '1', studentName: 'Alice Johnson', rollNumber: '001' },
    
    // Bob's records
    { date: '2024-01-15', status: 'absent', studentId: '2', studentName: 'Bob Smith', rollNumber: '002' },
    { date: '2024-01-16', status: 'absent', studentId: '2', studentName: 'Bob Smith', rollNumber: '002' },
    { date: '2024-01-17', status: 'present', studentId: '2', studentName: 'Bob Smith', rollNumber: '002' },
    { date: '2024-01-18', status: 'absent', studentId: '2', studentName: 'Bob Smith', rollNumber: '002' },
    { date: '2024-01-19', status: 'present', studentId: '2', studentName: 'Bob Smith', rollNumber: '002' },
    
    // Charlie's records
    { date: '2024-01-15', status: 'present', studentId: '3', studentName: 'Charlie Brown', rollNumber: '003' },
    { date: '2024-01-16', status: 'present', studentId: '3', studentName: 'Charlie Brown', rollNumber: '003' },
    { date: '2024-01-17', status: 'present', studentId: '3', studentName: 'Charlie Brown', rollNumber: '003' },
    { date: '2024-01-18', status: 'excused', studentId: '3', studentName: 'Charlie Brown', rollNumber: '003' },
    { date: '2024-01-19', status: 'present', studentId: '3', studentName: 'Charlie Brown', rollNumber: '003' },
    
    // More records for other students...
    { date: '2024-01-15', status: 'present', studentId: '4', studentName: 'Diana Prince', rollNumber: '004' },
    { date: '2024-01-16', status: 'late', studentId: '4', studentName: 'Diana Prince', rollNumber: '004' },
    { date: '2024-01-17', status: 'present', studentId: '4', studentName: 'Diana Prince', rollNumber: '004' },
    { date: '2024-01-18', status: 'present', studentId: '4', studentName: 'Diana Prince', rollNumber: '004' },
    { date: '2024-01-19', status: 'absent', studentId: '4', studentName: 'Diana Prince', rollNumber: '004' },
  ]

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-500'
      case 'absent': return 'bg-red-500'
      case 'late': return 'bg-yellow-500'
      case 'excused': return 'bg-blue-500'
      default: return 'bg-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <Check className="h-3 w-3 text-white" />
      case 'absent': return <X className="h-3 w-3 text-white" />
      case 'late': return <Clock className="h-3 w-3 text-white" />
      case 'excused': return <Calendar className="h-3 w-3 text-white" />
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
    
    const summary = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length,
    }
    
    return summary
  }

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.includes(searchTerm)
  )

  const navigateMonth = (direction) => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

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
                  
                  return (
                    <div
                      key={day.toString()}
                      className={`bg-white p-2 min-h-20 relative ${
                        !isSameMonth(day, currentDate) ? 'text-gray-400' : ''
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                      {summary && (
                        <div className="space-y-1">
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
                          {summary.late > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                              <span className="text-xs">{summary.late}</span>
                            </div>
                          )}
                          {summary.excused > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-xs">{summary.excused}</span>
                            </div>
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
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span>Late</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Excused</span>
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
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
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