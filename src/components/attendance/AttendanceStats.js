import { motion } from 'framer-motion'
import { Card, CardContent } from "../ui/card"
import { Users, TrendingUp, AlertCircle } from 'lucide-react'

const StatCard = ({ title, value, icon: Icon, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
  >
    <Card className={`${gradient} border-opacity-50`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm font-medium opacity-80">{title}</p>
            <motion.p 
              className="text-lg md:text-2xl font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
            >
              {value}
            </motion.p>
          </div>
          <motion.div
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: delay + 0.3, duration: 0.6 }}
          >
            <Icon className="h-6 w-6 md:h-8 md:w-8 opacity-70" />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

export default function AttendanceStats({ students }) {
  const totalStudents = students.length
  const averageAttendance = totalStudents > 0 
    ? Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / totalStudents) 
    : 0
  const studentsNeedingAttention = students.filter(s => s.attendancePercentage < 80).length

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard
        title="Total Students"
        value={totalStudents}
        icon={Users}
        gradient="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-800"
        delay={0}
      />
      
      <StatCard
        title="Avg. Attendance"
        value={`${averageAttendance}%`}
        icon={TrendingUp}
        gradient="bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-800"
        delay={0.1}
      />
      
      <StatCard
        title="Need Attention"
        value={studentsNeedingAttention}
        icon={AlertCircle}
        gradient="col-span-2 md:col-span-1 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 text-orange-800"
        delay={0.2}
      />
    </div>
  )
}