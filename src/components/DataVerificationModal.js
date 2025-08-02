import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { X, CheckCircle, AlertCircle, Calendar, Users, BarChart3 } from 'lucide-react'
import { attendanceOperations } from '../lib/api-production'

export default function DataVerificationModal({ 
  isOpen, 
  onClose, 
  studentId, 
  studentName 
}) {
  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(false)

  const verifyData = async () => {
    if (!studentId) return
    
    try {
      setLoading(true)
      const result = await attendanceOperations.verifyStudentDataPreservation(studentId)
      setVerification(result)
    } catch (error) {
      console.error('Error verifying data:', error)
      alert('Failed to verify data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-')
    return new Date(year, month - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100vh', scale: 0.9 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: '100vh', scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Data Verification</h2>
              <p className="text-gray-600">{studentName}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {!verification ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <CheckCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Verify Data Preservation</h3>
                <p className="text-gray-600 mb-6">
                  Click below to verify that all attendance data for this student is intact and preserved.
                </p>
              </div>
              <Button 
                onClick={verifyData} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Verifying...' : 'Verify Data'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Overview */}
              <Card className={verification.isDataIntact ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {verification.isDataIntact ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <h3 className={`font-semibold ${verification.isDataIntact ? 'text-green-800' : 'text-red-800'}`}>
                        {verification.isDataIntact ? 'Data Preserved Successfully' : 'No Data Found'}
                      </h3>
                      <p className={`text-sm ${verification.isDataIntact ? 'text-green-700' : 'text-red-700'}`}>
                        {verification.isDataIntact 
                          ? `${verification.totalRecords} attendance records found and preserved`
                          : 'No attendance records found for this student'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {verification.isDataIntact && (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{verification.totalRecords}</div>
                        <div className="text-sm text-gray-600">Total Records</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {Object.keys(verification.monthlyBreakdown).length}
                        </div>
                        <div className="text-sm text-gray-600">Months Covered</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {verification.student.is_active ? 'Active' : 'Archived'}
                        </div>
                        <div className="text-sm text-gray-600">Current Status</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Date Range */}
                  {verification.dateRange && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Date Range</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">First Record</p>
                            <p className="font-semibold">{formatDate(verification.dateRange.first)}</p>
                          </div>
                          <div className="text-center">
                            <div className="w-16 h-0.5 bg-gray-300"></div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Last Record</p>
                            <p className="font-semibold">{formatDate(verification.dateRange.last)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Monthly Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(verification.monthlyBreakdown)
                          .sort(([a], [b]) => b.localeCompare(a)) // Most recent first
                          .map(([month, data]) => {
                            const percentage = Math.round((data.present / data.total) * 100)
                            return (
                              <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{formatMonth(month)}</p>
                                  <p className="text-sm text-gray-600">
                                    {data.present} present, {data.absent} absent
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-blue-600">{percentage}%</p>
                                  <p className="text-xs text-gray-500">{data.total} total days</p>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Student Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Student Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-semibold">{verification.student.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Roll Number</p>
                          <p className="font-semibold">{verification.student.roll_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            verification.student.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {verification.student.is_active ? 'Active' : 'Archived'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Overall Attendance</p>
                          <p className="font-semibold">{verification.student.attendance_percentage}%</p>
                        </div>
                      </div>
                      
                      {!verification.student.is_active && verification.student.archived_at && (
                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-800">
                            <strong>Archived:</strong> {formatDate(verification.student.archived_at)}
                          </p>
                          {verification.student.archived_reason && (
                            <p className="text-sm text-orange-700 mt-1">
                              <strong>Reason:</strong> {verification.student.archived_reason}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              <div className="flex justify-end gap-3">
                <Button onClick={verifyData} variant="outline">
                  Verify Again
                </Button>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}