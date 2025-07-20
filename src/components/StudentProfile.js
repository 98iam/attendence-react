import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { motion } from 'framer-motion'
import { Phone, Mail, Calendar, TrendingUp, Check, X, ArrowLeft } from 'lucide-react'

export default function StudentProfile({ student, onBack }) {
  const selectedStudent = {
    ...student,
    avatar: student.name.split(' ').map(n => n[0]).join('')
  }

  // Use real attendance data from the student object
  const stats = useMemo(() => {
    const total = student.totalClasses || 0
    const present = student.presentClasses || 0
    const absent = total - present
    const percentage = student.attendancePercentage || 0
    
    return {
      total,
      present,
      absent,
      percentage
    }
  }, [student])

  // Helper function to format dates
  const formatShortDate = (dateStr) => {
    if (!dateStr) return 'Not available'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Students
            </Button>
          </div>
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
                  {selectedStudent.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedStudent.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedStudent.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{selectedStudent.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedStudent.admissionDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Admission Date</p>
                        <p className="font-medium">{formatShortDate(selectedStudent.admissionDate)}</p>
                      </div>
                    </div>
                  )}
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
                  <CardTitle className="text-lg">Attendance Overview</CardTitle>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">{stats.percentage}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stats.total > 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <div className="text-6xl font-bold text-blue-600 mb-2">{stats.percentage}%</div>
                      <p className="text-lg text-gray-600">Overall Attendance Rate</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{stats.present}</div>
                        <p className="text-sm text-gray-600">Days Present</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
                        <p className="text-sm text-gray-600">Days Absent</p>
                      </div>
                    </div>
                    <div className="mt-8 max-w-md mx-auto">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {stats.present} out of {stats.total} classes attended
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
                    <p className="text-gray-600">
                      No attendance records have been recorded for this student yet.
                    </p>
                  </div>
                )}
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