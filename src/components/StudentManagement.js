import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, User, Search, X, Loader2, Archive, RotateCcw, Eye, EyeOff, Shield } from 'lucide-react'
import StudentProfile from './StudentProfile'
import DataVerificationModal from './DataVerificationModal'
import { studentAPI } from '../lib/api-production'

export default function StudentManagement() {
  const [students, setStudents] = useState([])
  const [archivedStudents, setArchivedStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('active') // 'active' or 'archived'
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [studentToArchive, setStudentToArchive] = useState(null)
  const [archiveReason, setArchiveReason] = useState('')
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [studentToVerify, setStudentToVerify] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    phone: ''
  })

  // Load students from Supabase
  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const [activeData, archivedData] = await Promise.all([
        studentAPI.getAll(false), // Only active students
        studentAPI.getArchived()   // Only archived students
      ])

      // Transform active students data
      const transformedActiveData = activeData.map(student => ({
        id: student.id,
        name: student.name,
        rollNumber: student.roll_number,
        phone: student.phone || '',
        email: student.email || '',
        attendancePercentage: parseFloat((student.attendance_percentage || 0).toFixed(2)),
        totalClasses: student.total_classes || 0,
        presentClasses: student.present_classes || 0,
        consecutiveAbsences: student.consecutive_absences || 0,
        isActive: student.is_active,
        archivedAt: student.archived_at,
        archivedReason: student.archived_reason
      }))

      // Transform archived students data
      const transformedArchivedData = archivedData.map(student => ({
        id: student.id,
        name: student.name,
        rollNumber: student.roll_number,
        phone: student.phone || '',
        email: student.email || '',
        attendancePercentage: parseFloat((student.attendance_percentage || 0).toFixed(2)),
        totalClasses: student.total_classes || 0,
        presentClasses: student.present_classes || 0,
        consecutiveAbsences: student.consecutive_absences || 0,
        isActive: student.is_active,
        archivedAt: student.archived_at,
        archivedReason: student.archived_reason
      }))

      setStudents(transformedActiveData)
      setArchivedStudents(transformedArchivedData)
    } catch (error) {
      console.error('Error loading students:', error)
      alert('Failed to load students. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingStudent) {
        // Update existing student
        await studentAPI.update(editingStudent.id, formData)
      } else {
        // Add new student
        await studentAPI.create(formData)
      }

      // Reload students from database
      await loadStudents()

      setFormData({ name: '', rollNumber: '', phone: '' })
      setEditingStudent(null)
      setShowAddForm(false)
    } catch (error) {
      console.error('Error saving student:', error)
      alert('Failed to save student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      phone: student.phone || ''
    })
    setShowAddForm(true)
  }

  const handleArchive = (student) => {
    setStudentToArchive(student)
    setArchiveReason('Student left the class')
    setShowArchiveModal(true)
  }

  const confirmArchive = async () => {
    if (!studentToArchive) return

    try {
      setLoading(true)
      await studentAPI.archive(studentToArchive.id, archiveReason)
      await loadStudents()
      setShowArchiveModal(false)
      setStudentToArchive(null)
      setArchiveReason('')
    } catch (error) {
      console.error('Error archiving student:', error)
      alert('Failed to archive student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (studentId) => {
    if (window.confirm('Are you sure you want to restore this student to active status?')) {
      try {
        setLoading(true)
        await studentAPI.restore(studentId)
        await loadStudents()
      } catch (error) {
        console.error('Error restoring student:', error)
        alert('Failed to restore student. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handlePermanentDelete = async (studentId) => {
    if (window.confirm('⚠️ WARNING: This will permanently delete the student and ALL their attendance history. This action cannot be undone. Are you absolutely sure?')) {
      try {
        setLoading(true)
        await studentAPI.permanentDelete(studentId)
        await loadStudents()
      } catch (error) {
        console.error('Error permanently deleting student:', error)
        alert('Failed to delete student. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleVerifyData = (student) => {
    setStudentToVerify(student)
    setShowVerificationModal(true)
  }

  const currentStudents = viewMode === 'active' ? students : archivedStudents
  const filteredStudents = currentStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetForm = () => {
    setFormData({ name: '', rollNumber: '', phone: '' })
    setEditingStudent(null)
    setShowAddForm(false)
  }

  const handleStudentClick = (student) => {
    setSelectedStudent(student)
  }

  const handleBackToList = () => {
    setSelectedStudent(null)
  }

  // If a student is selected, show their profile
  if (selectedStudent) {
    return <StudentProfile student={selectedStudent} onBack={handleBackToList} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Student Management</h1>
              <p className="text-xs md:text-sm text-gray-600 mt-1">Add and manage students</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Add Student</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* View Toggle and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* View Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'active' ? 'default' : 'outline'}
                  onClick={() => setViewMode('active')}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Active ({students.length})
                </Button>
                <Button
                  variant={viewMode === 'archived' ? 'default' : 'outline'}
                  onClick={() => setViewMode('archived')}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archived ({archivedStudents.length})
                </Button>
              </div>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder={`Search ${viewMode} students...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {viewMode === 'active' ? `Active Students (${students.length})` : `Archived Students (${archivedStudents.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">
                  {currentStudents.length === 0
                    ? `No ${viewMode} students found`
                    : 'No students match your search'}
                </p>
                <p className="text-sm text-gray-400">
                  {currentStudents.length === 0
                    ? (viewMode === 'active'
                      ? 'Click "Add Student" to get started'
                      : 'No students have been archived yet')
                    : 'Try a different search term'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredStudents
                  .sort((a, b) => {
                    const rollA = parseInt(a.rollNumber) || 0;
                    const rollB = parseInt(b.rollNumber) || 0;
                    return rollA - rollB;
                  })
                  .map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleStudentClick(student)}
                    >
                      {/* Mobile Layout */}
                      <div className="block md:hidden">
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-blue-600">
                                {student.rollNumber}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                  {student.name}
                                </h3>
                                {viewMode === 'archived' && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                    ARCHIVED
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">Roll No: {student.rollNumber}</p>
                              {viewMode === 'archived' && student.archivedAt && (
                                <p className="text-xs text-orange-600 mb-2">
                                  Archived: {new Date(student.archivedAt).toLocaleDateString()}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">Attendance:</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${student.attendancePercentage >= 90 ? 'bg-green-500' :
                                        student.attendancePercentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                      style={{ width: `${student.attendancePercentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-blue-600">
                                    {student.attendancePercentage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Mobile Action Buttons */}
                          <div className="flex gap-2 pt-3 border-t border-gray-100">
                            {viewMode === 'active' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(student)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleArchive(student)
                                  }}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleVerifyData(student)
                                  }}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Verify
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRestore(student.id)
                                  }}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restore
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePermanentDelete(student.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-600">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-600">Roll No: {student.rollNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-500">Attendance</p>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${student.attendancePercentage >= 90 ? 'bg-green-500' :
                                    student.attendancePercentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                  style={{ width: `${student.attendancePercentage}%` }}
                                />
                              </div>
                              <span className="text-lg font-bold text-blue-600 min-w-[3rem] text-right">
                                {student.attendancePercentage}%
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {viewMode === 'active' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(student)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleArchive(student)
                                  }}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRestore(student.id)
                                  }}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePermanentDelete(student.id)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Student Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={resetForm}
          >
            <motion.div
              initial={{ y: '100vh' }}
              animate={{ y: 0 }}
              exit={{ y: '100vh' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-lg md:rounded-lg p-6 max-w-md w-full h-full md:h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter student's full name"
                  />
                </div>

                <div>
                  <label htmlFor="roll-number" className="block text-sm font-medium text-gray-700 mb-1">
                    Roll Number *
                  </label>
                  <input
                    id="roll-number"
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter roll number"
                  />
                </div>

                <div>
                  <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    id="phone-number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingStudent ? 'Update Student' : 'Add Student'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Archive Student Modal */}
      <AnimatePresence>
        {showArchiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowArchiveModal(false)}
          >
            <motion.div
              initial={{ y: '100vh' }}
              animate={{ y: 0 }}
              exit={{ y: '100vh' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-lg md:rounded-lg p-6 max-w-md w-full h-full md:h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-orange-600">Archive Student</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowArchiveModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Archive className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-800">
                      Archive {studentToArchive?.name}?
                    </h3>
                  </div>
                  <p className="text-sm text-orange-700">
                    This student will be moved to archived status but their attendance history will be preserved.
                    You can restore them later if needed.
                  </p>
                </div>

                <div>
                  <label htmlFor="archive-reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for archiving
                  </label>
                  <textarea
                    id="archive-reason"
                    value={archiveReason}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter reason for archiving this student..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={confirmArchive}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Student
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowArchiveModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Verification Modal */}
      <DataVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        studentId={studentToVerify?.id}
        studentName={studentToVerify?.name}
      />
    </div>
  )
}