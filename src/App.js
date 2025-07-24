import React, { useState } from 'react';
import Navigation from './components/Navigation';
import BottomNavigation from './components/BottomNavigation';
import AttendanceDashboard from './components/AttendanceDashboard';
import StudentManagement from './components/StudentManagement';
import AttendanceHistory from './components/AttendanceHistory';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('attendance');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AttendanceDashboard />;
      case 'students':
        return <StudentManagement />;
      case 'history':
        return <AttendanceHistory />;
      case 'attendance':
        return <AttendanceDashboard />;
      default:
        return <AttendanceDashboard />;
    }
  };

  return (
    <div className="App pb-16 md:pb-0">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      <main>{renderCurrentView()}</main>
      <BottomNavigation currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

export default App;