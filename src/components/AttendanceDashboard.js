import { Button } from "./ui/button"
import { motion } from 'framer-motion'

// Import split components
import AttendanceStats from './attendance/AttendanceStats'
import ClassOverview from './attendance/ClassOverview'
import AbsenceAlerts from './attendance/AbsenceAlerts'
import AttendanceMode from './attendance/AttendanceMode'
import AttendanceResults from './attendance/AttendanceResults'

// Import custom hooks
import { useStudents } from './attendance/hooks/useStudents'
import { useAttendance } from './attendance/hooks/useAttendance'

export default function AttendanceDashboard() {
  const { students, loading, absenceNotifications } = useStudents()
  const {
    showAttendanceMode,
    swipeStudents,
    history,
    attendance,
    showResults,
    attendanceResults,
    startAttendanceMode,
    handleSwipe,
    handleUndo,
    closeAttendanceMode,
    setShowResults
  } = useAttendance(students)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        className="bg-white shadow-sm border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                className="text-xl md:text-2xl font-bold text-gray-900"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Attendance Dashboard
              </motion.h1>
              <motion.p 
                className="text-xs md:text-sm text-gray-600 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {today}
              </motion.p>
            </div>
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={startAttendanceMode}
                className="bg-green-600 hover:bg-green-700"
                disabled={students.length === 0}
                size="sm"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  📋
                </motion.div>
                <span className="ml-2 hidden md:inline">Take Attendance</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <AttendanceStats students={students} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Overview - Takes 2/3 of the space */}
          <div className="lg:col-span-2">
            <ClassOverview students={students} />
          </div>

          {/* Absence Alerts - Takes 1/3 of the space */}
          <div className="lg:col-span-1">
            <AbsenceAlerts absenceNotifications={absenceNotifications} />
          </div>
        </div>

        {/* Attendance Mode */}
        <AttendanceMode
          showAttendanceMode={showAttendanceMode}
          swipeStudents={swipeStudents}
          students={students}
          history={history}
          handleSwipe={handleSwipe}
          handleUndo={handleUndo}
          closeAttendanceMode={closeAttendanceMode}
        />

        {/* Attendance Results */}
        <AttendanceResults
          showResults={showResults}
          attendanceResults={attendanceResults}
          setShowResults={setShowResults}
        />
      </div>
    </div >
  )
}