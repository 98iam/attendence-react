import React, { useState } from 'react';
import Navigation from './components/Navigation';
import AttendanceDashboard from './components/AttendanceDashboard';
import StudentManagement from './components/StudentManagement';
import AttendanceHistory from './components/AttendanceHistory';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AttendanceDashboard />;
      case 'students':
        return <StudentManagement />;
      case 'history':
        return <AttendanceHistory />;
      default:
        return <AttendanceDashboard />;
    }
  };

  return (
    <div className="App">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {renderCurrentView()}
    </div>
  );
}

export default App;