import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

const StudentRow = ({ student, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05, duration: 0.4 }}
    className="flex items-center justify-between"
  >
    <div>
      <p className="text-sm font-medium">{student.name}</p>
      <p className="text-xs text-gray-600">Roll: {student.rollNumber}</p>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-200 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${
            student.attendancePercentage >= 90 ? 'bg-green-500' :
            student.attendancePercentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${student.attendancePercentage}%` }}
          transition={{ delay: index * 0.05 + 0.2, duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <motion.span 
        className="text-sm font-medium w-10 text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05 + 0.4 }}
      >
        {student.attendancePercentage}%
      </motion.span>
    </div>
  </motion.div>
)

const InsightCard = ({ label, count, bgColor, textColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
    className={`flex items-center justify-between p-3 ${bgColor} rounded-lg`}
  >
    <span className="text-sm">{label}</span>
    <motion.span 
      className={`font-semibold ${textColor}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: delay + 0.2, type: "spring", stiffness: 300 }}
    >
      {count}
    </motion.span>
  </motion.div>
)

export default function ClassOverview({ students }) {
  const sortedStudents = [...students].sort((a, b) => {
    const rollA = parseInt(a.rollNumber) || 0;
    const rollB = parseInt(b.rollNumber) || 0;
    return rollA - rollB;
  })

  const excellentCount = students.filter(s => s.attendancePercentage >= 90).length
  const goodCount = students.filter(s => s.attendancePercentage >= 80 && s.attendancePercentage < 90).length
  const needsImprovementCount = students.filter(s => s.attendancePercentage < 80).length

  return (
    <Card>
      <CardHeader>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardTitle className="text-lg">Class Overview</CardTitle>
        </motion.div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <motion.h3 
              className="font-medium mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Attendance Distribution
            </motion.h3>
            <div className="space-y-2">
              {sortedStudents.map((student, index) => (
                <StudentRow key={student.id} student={student} index={index} />
              ))}
            </div>
          </div>

          <div>
            <motion.h3 
              className="font-medium mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Quick Insights
            </motion.h3>
            <div className="space-y-3">
              <InsightCard
                label="Excellent (90%+)"
                count={excellentCount}
                bgColor="bg-green-50"
                textColor="text-green-700"
                delay={0.4}
              />
              <InsightCard
                label="Good (80-89%)"
                count={goodCount}
                bgColor="bg-yellow-50"
                textColor="text-yellow-700"
                delay={0.5}
              />
              <InsightCard
                label="Needs Improvement (<80%)"
                count={needsImprovementCount}
                bgColor="bg-red-50"
                textColor="text-red-700"
                delay={0.6}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}