import { BarChart3, History, Users, Calendar } from 'lucide-react'

export default function BottomNavigation({ currentView, onViewChange }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'history', label: 'History', icon: History },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-t border-t z-10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
