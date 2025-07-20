import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { motion } from 'framer-motion'
import { User, Phone, Mail, Calendar, TrendingUp, Check, X } from 'lucide-react'

export default function StudentProfile() {
  const [selectedStudent] = useState({
    id: '1',
    name: 'Alice Johnson',
    rollNumber: '001',
    email: 'alice.johnson@school.edu',
    phone: '+1 (555) 123-4567',
    admissionDate: '2022-09-01',
    avatar: 'AJ'
  })

  // Mock attendance data for the last 30 days
  const attendanceRecords = useMemo(() => {
    const records = []
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const random = Math.random()
      
      let status = random < 0.85 ? 'present' : 'absent'
      
      records.push({
        date: date.toISOString().split('T')[0],
        status
      })
    }
    
    return records.reverse()
  }, [])

  const stats = useMemo(() => {
    const total = attendanceRecords.length
    const present = attendanceRecords.filter(r => r.status === 'present').length
    const absent = attendanceRecords.filter(r => r.status === 'absent').length
    
    return {
      total,
      present,
      absent,
      percentage: Math.round((present / total) * 100)
    }
  }, [attendanceRecords])

  const getStatusColor = (status) => {
    return status === 'present' ? 'bg-green-500' : 'bg-red-500'
  }

  const getStatusIcon = (status) => {
    return status === 'present' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatShortDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getLast30Days = () => {
    const days = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      days.push(date)
    }
    
    return days
  }

  const getAttendanceForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return attendanceRecords.find(record => record.date === dateStr)
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const last30Days = getLast30Days()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
          <p className="text-gray-600 mt-2">Detailed attendance and student information</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Info Card */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32 relative">
                <div className="absolute -bottom-12 left-6">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-blue-600">{selectedStudent.avatar}</span>
                  </div>
                </div>
              </div>
              <CardContent className="pt-16">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h2>
                  <p className="text-gray-600">Roll No: {selectedStudent.rollNumber}</p>
                </div>
                
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedStudent.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{selectedStudent.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Admission Date</p>
                      <p className="font-medium">{formatShortDate(selectedStudent.admissionDate)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Days</span>
                    <span className="font-bold text-2xl">{stats.total}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Present</span>
                      <span className="font-bold text-green-600">{stats.present}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(stats.present / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Absent</span>
                      <span className="font-bold text-red-600">{stats.absent}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${(stats.absent / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Attendance Record (Last 30 Days)</CardTitle>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">{stats.percentage}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                  {last30Days.map((day, index) => {
                    const record = getAttendanceForDate(day)
                    const todayCheck = isToday(day)
                    
                    return (
                      <motion.div
                        key={day.toString()}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className={`
                          aspect-square rounded-lg flex flex-col items-center justify-center text-xs
                          ${record ? getStatusColor(record.status) : 'bg-gray-100'}
                          ${todayCheck ? 'ring-2 ring-blue-500' : ''}
                          ${record ? 'text-white' : 'text-gray-400'}
                          hover:scale-105 transition-transform cursor-pointer
                        `}
                      >
                        <span className="font-bold">{day.getDate()}</span>
                        {record && (
                          <div className="mt-1">
                            {getStatusIcon(record.status)}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Detailed Records */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Recent Records</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {attendanceRecords.slice(-10).reverse().map((record, index) => (
                      <motion.div
                        key={record.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            ${getStatusColor(record.status)} text-white
                          `}>
                            {getStatusIcon(record.status)}
                          </div>
                          <div>
                            <p className="font-medium">{formatDate(record.date)}</p>
                            <p className="text-sm text-gray-600">
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </p>
                          </div>
                        </div>
                        <div className={`
                          px-3 py-1 rounded-full text-sm font-medium
                          ${record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        `}>
                          {record.status.toUpperCase()}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.percentage}%</div>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                    <p className="text-sm text-gray-600">Days Present</p>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                    <p className="text-sm text-gray-600">Days Absent</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Attendance Trend</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full"
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{stats.percentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}