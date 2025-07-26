import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "../ui/button"
import { Check, X } from 'lucide-react'

const ResultCard = ({ result, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    transition={{ 
      delay: index * 0.05, 
      duration: 0.4,
      type: "spring",
      stiffness: 200
    }}
    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm"
  >
    <div className="flex items-center gap-3">
      <motion.div 
        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold"
        initial={{ rotate: -180 }}
        animate={{ rotate: 0 }}
        transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
      >
        {result.rollNumber}
      </motion.div>
      <div>
        <p className="font-medium text-gray-900">{result.studentName}</p>
        <p className="text-sm text-gray-600">Roll: {result.rollNumber}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <motion.span 
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          result.status === 'present'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: index * 0.05 + 0.3, 
          type: "spring", 
          stiffness: 300 
        }}
      >
        {result.status === 'present' ? (
          <Check className="h-3 w-3" />
        ) : (
          <X className="h-3 w-3" />
        )}
        {result.status === 'present' ? 'Present' : 'Absent'}
      </motion.span>
    </div>
  </motion.div>
)

const SummaryCard = ({ count, label, bgColor, textColor, icon: Icon, delay }) => (
  <motion.div 
    className={`${bgColor} p-4 rounded-lg text-center`}
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
    whileHover={{ scale: 1.05 }}
  >
    <motion.div 
      className={`text-2xl font-bold ${textColor} flex items-center justify-center gap-2`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: delay + 0.2, type: "spring", stiffness: 300 }}
    >
      <Icon className="h-6 w-6" />
      {count}
    </motion.div>
    <div className={`text-sm ${textColor} opacity-80`}>{label}</div>
  </motion.div>
)

export default function AttendanceResults({ showResults, attendanceResults, setShowResults }) {
  if (!showResults) return null

  const presentCount = attendanceResults.filter(r => r.status === 'present').length
  const absentCount = attendanceResults.filter(r => r.status === 'absent').length

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setShowResults(false)}
      >
        <motion.div
          initial={{ y: '100vh', scale: 0.9 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: '100vh', scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-t-lg md:rounded-lg p-6 max-w-2xl w-full h-full md:h-auto md:max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900">Attendance Results</h2>
              <p className="text-gray-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="ghost"
                onClick={() => setShowResults(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <SummaryCard
              count={presentCount}
              label="Present"
              bgColor="bg-green-50"
              textColor="text-green-600"
              icon={Check}
              delay={0.4}
            />
            <SummaryCard
              count={absentCount}
              label="Absent"
              bgColor="bg-red-50"
              textColor="text-red-600"
              icon={X}
              delay={0.5}
            />
          </div>

          {/* Student List */}
          <div className="space-y-2">
            <motion.h3 
              className="font-semibold text-gray-900 mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Student-wise Attendance (Roll Number Order)
            </motion.h3>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {attendanceResults.map((result, index) => (
                <ResultCard key={result.studentId} result={result} index={index} />
              ))}
            </motion.div>
          </div>

          <motion.div 
            className="mt-6 flex justify-end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => setShowResults(false)}>
                Close
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}