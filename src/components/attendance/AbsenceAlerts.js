import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { AlertCircle, Check } from 'lucide-react'

const getRiskLevel = (consecutiveAbsences) => {
  if (consecutiveAbsences >= 3) return { level: 'High Risk', color: 'text-red-600 bg-red-50' }
  if (consecutiveAbsences >= 2) return { level: 'Medium Risk', color: 'text-orange-600 bg-orange-50' }
  return { level: 'Low Risk', color: 'text-yellow-600 bg-yellow-50' }
}

const SummaryCard = ({ count, label, bgColor, textColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
    className={`text-center p-2 ${bgColor} rounded border`}
  >
    <motion.div 
      className={`text-lg font-bold ${textColor}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: delay + 0.2, type: "spring", stiffness: 300 }}
    >
      {count}
    </motion.div>
    <div className="text-xs opacity-80">{label}</div>
  </motion.div>
)

const AlertCard = ({ notification, index }) => {
  const risk = getRiskLevel(notification.consecutiveAbsences)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.4,
        type: "spring",
        stiffness: 200
      }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`p-3 rounded-lg border ${
        notification.consecutiveAbsences >= 3 ? 'bg-red-50 border-red-200' :
        notification.consecutiveAbsences >= 2 ? 'bg-orange-50 border-orange-200' :
        'bg-yellow-50 border-yellow-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.div 
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
              notification.consecutiveAbsences >= 3 ? 'bg-red-500' :
              notification.consecutiveAbsences >= 2 ? 'bg-orange-500' :
              'bg-yellow-500'
            }`}
            initial={{ rotate: -180 }}
            animate={{ rotate: 0 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
          >
            {notification.rollNumber}
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{notification.studentName}</p>
          </div>
        </div>
        <motion.div 
          className={`text-lg font-bold ${
            notification.consecutiveAbsences >= 3 ? 'text-red-700' :
            notification.consecutiveAbsences >= 2 ? 'text-orange-700' :
            'text-yellow-700'
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 300 }}
        >
          {notification.consecutiveAbsences}
        </motion.div>
      </div>
      <div className="text-xs">
        <motion.span 
          className={`inline-block px-2 py-1 rounded text-xs font-medium ${risk.color}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.4 }}
        >
          {risk.level}
        </motion.span>
        <motion.p 
          className={`mt-1 ${
            notification.consecutiveAbsences >= 3 ? 'text-red-600' :
            notification.consecutiveAbsences >= 2 ? 'text-orange-600' :
            'text-yellow-600'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.5 }}
        >
          {notification.consecutiveAbsences >= 3 ? '📞 Contact parent' :
           notification.consecutiveAbsences >= 2 ? '⚠️ Follow up' :
           '👀 Monitor closely'}
        </motion.p>
      </div>
    </motion.div>
  )
}

export default function AbsenceAlerts({ absenceNotifications }) {
  if (absenceNotifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              All Clear
            </CardTitle>
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="text-center py-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <motion.div 
              className="text-4xl mb-2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              ✅
            </motion.div>
            <p className="text-sm text-gray-600">No absence alerts</p>
            <p className="text-xs text-gray-500 mt-1">All students have good attendance</p>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardTitle className="text-lg flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
            >
              <AlertCircle className="h-5 w-5 text-red-500" />
            </motion.div>
            Absence Alerts
          </CardTitle>
          <motion.p 
            className="text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {absenceNotifications.length} student{absenceNotifications.length !== 1 ? 's' : ''} need attention
          </motion.p>
        </motion.div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <SummaryCard
            count={absenceNotifications.filter(n => n.consecutiveAbsences === 1).length}
            label="1 Day"
            bgColor="bg-yellow-50 border-yellow-200"
            textColor="text-yellow-700"
            delay={0.3}
          />
          <SummaryCard
            count={absenceNotifications.filter(n => n.consecutiveAbsences === 2).length}
            label="2 Days"
            bgColor="bg-orange-50 border-orange-200"
            textColor="text-orange-700"
            delay={0.4}
          />
          <SummaryCard
            count={absenceNotifications.filter(n => n.consecutiveAbsences >= 3).length}
            label="3+ Days"
            bgColor="bg-red-50 border-red-200"
            textColor="text-red-700"
            delay={0.5}
          />
        </div>

        {/* Student List */}
        <div className="space-y-2">
          <AnimatePresence>
            {absenceNotifications.map((notification, index) => (
              <AlertCard 
                key={notification.studentId} 
                notification={notification} 
                index={index} 
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer Note */}
        <motion.div 
          className="mt-4 p-2 bg-blue-50 rounded border border-blue-200"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Alerts clear when students are marked present.
          </p>
        </motion.div>
      </CardContent>
    </Card>
  )
}