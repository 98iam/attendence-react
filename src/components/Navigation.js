import { useState } from 'react'
import { Button } from "./ui/button"
import { BarChart3, History, Users, Calendar } from 'lucide-react'

export default function Navigation({ currentView, onViewChange }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'profile', label: 'Profile', icon: Users },
    { id: 'history', label: 'History', icon: History },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Attendance System</span>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? 'default' : 'ghost'}
                  onClick={() => onViewChange(item.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}