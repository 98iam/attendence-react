import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "../ui/button"
import { Check, X, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'
import { useDragHandler } from './hooks/useDragHandler'

const StudentCard = ({ student, index, dragState, handlePointerDown, SWIPE_THRESHOLD, isTopCard }) => {
  const presentOpacity = Math.max(0, -dragState.deltaY / SWIPE_THRESHOLD);
  const absentOpacity = Math.max(0, dragState.deltaY / SWIPE_THRESHOLD);

  return (
    <motion.div
      key={student.id}
      className="absolute inset-0 bg-white rounded-3xl shadow-lg overflow-hidden"
      style={{
        zIndex: index,
        cursor: isTopCard ? (dragState.isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: 'none'
      }}
      onPointerDown={isTopCard ? handlePointerDown : undefined}
      initial={{ y: 50, opacity: 0, scale: 0.9 }}
      animate={{
        y: index * 10 + (isTopCard ? dragState.deltaY : 0),
        scale: 1 - index * 0.05,
        opacity: 1
      }}
      exit={{ 
        y: -100, 
        opacity: 0, 
        scale: 0.8,
        rotate: dragState.deltaY < 0 ? -10 : 10
      }}
      transition={{
        type: dragState.isDragging && isTopCard ? 'tween' : 'spring',
        stiffness: 300,
        damping: 30,
        duration: dragState.isDragging && isTopCard ? 0 : 0.4
      }}
      whileHover={!dragState.isDragging && isTopCard ? { scale: 1.02 } : {}}
    >
      {/* Present Feedback Overlay */}
      <motion.div
        className="absolute inset-0 bg-green-500 bg-opacity-80 flex items-center justify-center text-white text-3xl font-bold rounded-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: isTopCard ? presentOpacity : 0 }}
        transition={{ duration: 0.1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: presentOpacity > 0.3 ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          PRESENT ✓
        </motion.div>
      </motion.div>

      {/* Absent Feedback Overlay */}
      <motion.div
        className="absolute inset-0 bg-red-500 bg-opacity-80 flex items-center justify-center text-white text-3xl font-bold rounded-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: isTopCard ? absentOpacity : 0 }}
        transition={{ duration: 0.1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: absentOpacity > 0.3 ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          ABSENT ✗
        </motion.div>
      </motion.div>

      {/* Card Content */}
      <div className="flex flex-col items-center justify-around h-full p-6">
        <div className="text-center">
          <motion.div 
            className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: index * 0.1, 
              type: "spring", 
              stiffness: 200,
              duration: 0.8 
            }}
          >
            <span className="text-4xl font-bold text-white">
              {student.name.split(' ').map(n => n[0]).join('')}
            </span>
          </motion.div>
          <motion.h3 
            className="text-2xl font-bold text-gray-900 mb-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            {student.name}
          </motion.h3>
          <motion.p 
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            Roll No: {student.rollNumber}
          </motion.p>
        </div>

        {/* Swipe Indicators */}
        <motion.div 
          className="flex flex-col items-center gap-4 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.4 }}
        >
          <motion.div 
            className="flex items-center gap-2 text-green-600"
            whileHover={{ scale: 1.05 }}
            animate={{ 
              y: isTopCard && presentOpacity > 0 ? -5 : 0,
              scale: isTopCard && presentOpacity > 0 ? 1.1 : 1
            }}
          >
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <ArrowUp size={20} />
            </div>
            <span className="font-semibold text-lg">Present</span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2 text-red-600"
            whileHover={{ scale: 1.05 }}
            animate={{ 
              y: isTopCard && absentOpacity > 0 ? 5 : 0,
              scale: isTopCard && absentOpacity > 0 ? 1.1 : 1
            }}
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <ArrowDown size={20} />
            </div>
            <span className="font-semibold text-lg">Absent</span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function AttendanceMode({ 
  showAttendanceMode, 
  swipeStudents, 
  students,
  history,
  handleSwipe,
  handleUndo,
  closeAttendanceMode 
}) {
  const { dragState, handlePointerDown, SWIPE_THRESHOLD } = useDragHandler(handleSwipe)

  if (!showAttendanceMode) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100vh' }}
        animate={{ y: 0 }}
        exit={{ y: '100vh' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-0 bg-gray-100 z-50 flex flex-col"
        style={{
          fontFamily: 'Poppins, sans-serif',
          userSelect: 'none'
        }}
      >
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between p-4 bg-white shadow-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            <h2 className="text-lg font-bold text-gray-800">Mark Attendance</h2>
            <p className="text-sm text-gray-600">
              {swipeStudents.length === 0 ? 'All Done!' : `${students.length - swipeStudents.length + 1} of ${students.length}`}
            </p>
          </div>
          <Button
            onClick={closeAttendanceMode}
            variant="ghost"
            className="text-gray-600 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </Button>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          className="px-4 py-3 bg-white border-b"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((students.length - swipeStudents.length) / students.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm">
            {/* Card Stack */}
            <div className="relative h-96 mb-8">
              {swipeStudents.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-lg"
                >
                  <motion.div 
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  >
                    <Check size={40} className="text-green-600" />
                  </motion.div>
                  <motion.h3 
                    className="text-2xl font-bold text-gray-900 mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    All Done!
                  </motion.h3>
                  <motion.p 
                    className="text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Attendance has been recorded.
                  </motion.p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {swipeStudents.slice(0, 3).map((student, index) => {
                    const isTopCard = index === 0;
                    const presentOpacity = Math.max(0, -dragState.deltaY / SWIPE_THRESHOLD);
                    const absentOpacity = Math.max(0, dragState.deltaY / SWIPE_THRESHOLD);

                    return (
                      <motion.div
                        key={student.id}
                        className="absolute inset-0 bg-white rounded-3xl shadow-lg overflow-hidden"
                        style={{
                          zIndex: 3 - index,
                          cursor: isTopCard ? (dragState.isDragging ? 'grabbing' : 'grab') : 'default',
                          touchAction: 'none'
                        }}
                        onPointerDown={isTopCard ? handlePointerDown : undefined}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{
                          y: index * 10 + (isTopCard ? dragState.deltaY : 0),
                          scale: 1 - index * 0.05,
                          opacity: 1
                        }}
                        exit={{ 
                          y: dragState.deltaY < 0 ? -200 : 200, 
                          opacity: 0,
                          rotate: dragState.deltaY < 0 ? -30 : 30
                        }}
                        transition={{
                          type: dragState.isDragging && isTopCard ? 'tween' : 'spring',
                          stiffness: 300,
                          damping: 30,
                          duration: dragState.isDragging && isTopCard ? 0 : 0.3
                        }}
                      >
                        {/* Present Feedback Overlay */}
                        {isTopCard && (
                          <div
                            className="absolute inset-0 bg-green-500 bg-opacity-70 flex items-center justify-center text-white text-3xl font-bold rounded-3xl"
                            style={{ opacity: presentOpacity }}
                          >
                            PRESENT
                          </div>
                        )}

                        {/* Absent Feedback Overlay */}
                        {isTopCard && (
                          <div
                            className="absolute inset-0 bg-red-500 bg-opacity-70 flex items-center justify-center text-white text-3xl font-bold rounded-3xl"
                            style={{ opacity: absentOpacity }}
                          >
                            ABSENT
                          </div>
                        )}

                        {/* Card Content */}
                        <div className="flex flex-col items-center justify-around h-full p-6">
                          <div className="text-center">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                              <span className="text-4xl font-bold text-white">
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{student.name}</h3>
                            <p className="text-gray-600">Roll No: {student.rollNumber}</p>
                          </div>

                          {/* Swipe Indicators */}
                          {isTopCard && (
                            <div className="flex flex-col items-center gap-4 w-full">
                              <div className="flex items-center gap-2 text-green-600">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <ArrowUp size={20} />
                                </div>
                                <span className="font-semibold text-lg">Present</span>
                              </div>
                              <div className="flex items-center gap-2 text-red-600">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                  <ArrowDown size={20} />
                                </div>
                                <span className="font-semibold text-lg">Absent</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Action Buttons */}
            <motion.div 
              className="flex gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => handleSwipe('absent')}
                  disabled={swipeStudents.length === 0}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-lg"
                >
                  <X className="h-5 w-5 mr-2" />
                  Absent
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  variant="outline"
                  className="px-6 py-3 rounded-full shadow-lg"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Undo
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => handleSwipe('present')}
                  disabled={swipeStudents.length === 0}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full shadow-lg"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Present
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Instructions */}
        {swipeStudents.length > 0 && (
          <motion.div 
            className="p-4 text-center text-gray-600 bg-white border-t"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                Swipe up for Present, down for Absent
              </motion.span>
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}