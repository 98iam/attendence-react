import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, ArrowDown, ArrowUp, Check } from 'lucide-react';

const AttendanceSwiper = () => {
  const initialStudents = [
    { id: '1', name: 'Alice Johnson', rollNumber: '001', avatar: 'AJ' },
    { id: '2', name: 'Bob Smith', rollNumber: '002', avatar: 'BS' },
    { id: '3', name: 'Charlie Brown', rollNumber: '003', avatar: 'CB' },
    { id: '4', name: 'Diana Prince', rollNumber: '004', avatar: 'DP' },
    { id: '5', name: 'Ethan Hunt', rollNumber: '005', avatar: 'EH' },
    { id: '6', name: 'Fiona Green', rollNumber: '006', avatar: 'FG' },
  ];

  const [students, setStudents] = useState([...initialStudents]);
  const [history, setHistory] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [dragState, setDragState] = useState({
    isDragging: false,
    deltaY: 0,
    startY: 0
  });

  const SWIPE_THRESHOLD = 80;

  const handleSwipe = useCallback((status) => {
    if (students.length === 0) return;

    setStudents(prev => {
      const newStudents = [...prev];
      const swipedStudent = newStudents.pop();
      
      setHistory(prevHistory => [...prevHistory, swipedStudent]);
      setAttendance(prevAttendance => ({
        ...prevAttendance,
        [swipedStudent.id]: status
      }));
      
      console.log(`Marked ${swipedStudent.name} as ${status}`);
      
      return newStudents;
    });
  }, [students.length]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    
    setHistory(prev => {
      const newHistory = [...prev];
      const lastStudent = newHistory.pop();
      
      setStudents(prevStudents => [...prevStudents, lastStudent]);
      setAttendance(prev => {
        const newAttendance = { ...prev };
        delete newAttendance[lastStudent.id];
        return newAttendance;
      });
      
      return newHistory;
    });
  }, [history.length]);

  const handlePointerDown = (e) => {
    if (students.length === 0) return;
    
    setDragState({
      isDragging: true,
      startY: e.clientY,
      deltaY: 0
    });
    e.preventDefault();
  };

  const handlePointerMove = useCallback((e) => {
    if (!dragState.isDragging) return;
    
    const deltaY = e.clientY - dragState.startY;
    setDragState(prev => ({ ...prev, deltaY }));
  }, [dragState.isDragging, dragState.startY]);

  const handlePointerUp = useCallback(() => {
    if (!dragState.isDragging) return;
    
    const { deltaY } = dragState;
    setDragState({ isDragging: false, deltaY: 0, startY: 0 });

    if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
      // Swipe up is present (deltaY is negative)
      // Swipe down is absent (deltaY is positive)
      handleSwipe(deltaY < 0 ? 'present' : 'absent');
    }
  }, [dragState.isDragging, dragState.deltaY, handleSwipe]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [dragState.isDragging, handlePointerMove, handlePointerUp]);

  const Card = ({ student, index, isTopCard }) => {
    const presentOpacity = Math.max(0, -dragState.deltaY / SWIPE_THRESHOLD);
    const absentOpacity = Math.max(0, dragState.deltaY / SWIPE_THRESHOLD);
    
    const cardStyle = {
      zIndex: index,
      transform: `scale(${1 - (students.length - 1 - index) * 0.05}) translateY(${(students.length - 1 - index) * 10}px)${
        isTopCard && dragState.isDragging ? ` translateY(${dragState.deltaY}px)` : ''
      }`,
      transition: dragState.isDragging && isTopCard ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      cursor: isTopCard ? (dragState.isDragging ? 'grabbing' : 'grab') : 'default',
      touchAction: 'none'
    };

    return (
      <div 
        className="card" 
        style={cardStyle}
        onPointerDown={isTopCard ? handlePointerDown : undefined}
      >
        {/* Present Feedback Overlay */}
        <div 
          className="swipe-feedback-overlay present"
          style={{ opacity: isTopCard ? presentOpacity : 0 }}
        >
          PRESENT
        </div>
        
        {/* Absent Feedback Overlay */}
        <div 
          className="swipe-feedback-overlay absent"
          style={{ opacity: isTopCard ? absentOpacity : 0 }}
        >
          ABSENT
        </div>
        
        <div className="card-info">
          <div className="avatar">{student.avatar}</div>
          <h2>{student.name}</h2>
          <p className="roll-number">Roll No: {student.rollNumber}</p>
        </div>
        
        <div className="swipe-indicators">
          <div className="indicator present">
            <div className="icon">
              <ArrowUp size={20} />
            </div>
            <span>Present</span>
          </div>
          <div className="indicator absent">
            <div className="icon">
              <ArrowDown size={20} />
            </div>
            <span>Absent</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

        :root {
          --green: #22c55e;
          --red: #ef4444;
          --yellow: #eab308;
          --blue: #3b82f6;
          --indigo: #6366f1;
          --gray-100: #f3f4f6;
          --gray-500: #6b7280;
          --gray-800: #1f2937;
          --gray-900: #11182c;
          --white: #ffffff;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Poppins', sans-serif;
          background-color: var(--gray-100);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          overflow: hidden;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        .app-container {
          width: 100%;
          max-width: 360px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .header {
          text-align: center;
          margin-bottom: 24px;
        }

        .header h1 {
          font-size: 1.5rem;
          color: var(--gray-800);
          font-weight: 700;
        }

        .header p {
          color: var(--gray-500);
        }

        .card-stack {
          position: relative;
          width: 100%;
          height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card {
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: var(--white);
          border-radius: 20px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-around;
          padding: 24px;
        }

        .card-info {
          text-align: center;
        }

        .avatar {
          width: 128px;
          height: 128px;
          border-radius: 50%;
          background-image: linear-gradient(to bottom right, var(--blue), var(--indigo));
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          color: var(--white);
          font-size: 3rem;
          font-weight: 700;
        }

        .card-info h2 {
          font-size: 1.75rem;
          color: var(--gray-900);
          margin-bottom: 4px;
        }

        .card-info .roll-number {
          color: var(--gray-500);
        }

        .swipe-indicators {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .indicator .icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .indicator.present { color: var(--green); }
        .indicator.present .icon { background-color: #dcfce7; }

        .indicator.absent { color: var(--red); }
        .indicator.absent .icon { background-color: #fee2e2; }

        .swipe-feedback-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: 700;
          color: var(--white);
          opacity: 0;
          pointer-events: none;
          border-radius: 20px;
        }

        .swipe-feedback-overlay.present { 
          background-color: rgba(34, 197, 94, 0.7); 
        }
        
        .swipe-feedback-overlay.absent { 
          background-color: rgba(239, 68, 68, 0.7); 
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
          margin-top: 24px;
        }

        .action-button {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: none;
          background-color: var(--white);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.1s ease-out;
        }

        .action-button:disabled { 
          opacity: 0.5; 
          cursor: not-allowed; 
        }
        
        .action-button:not(:disabled):active { 
          transform: scale(0.9); 
        }
        
        .action-button.undo { 
          width: 56px; 
          height: 56px; 
        }

        .completion-screen {
          position: absolute;
          text-align: center;
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.3s, transform 0.3s;
          pointer-events: none;
        }

        .completion-screen.visible {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }

        .completion-icon {
          width: 80px;
          height: 80px;
          background-color: #dcfce7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
      `}</style>
      
      <header className="header">
        <h1>Mark Attendance</h1>
        <p>Swipe up for Present, down for Absent</p>
      </header>

      <div className="card-stack">
        {students.map((student, index) => (
          <Card 
            key={student.id}
            student={student}
            index={index}
            isTopCard={index === students.length - 1}
          />
        ))}
        
        <div className={`completion-screen ${students.length === 0 ? 'visible' : ''}`}>
          <div className="completion-icon">
            <Check size={40} color="var(--green)" />
          </div>
          <h2>All Done!</h2>
          <p className="roll-number">Attendance has been recorded.</p>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="action-button undo"
          onClick={handleUndo}
          disabled={history.length === 0}
          title="Undo"
        >
          <RotateCcw size={28} color="var(--yellow)" />
        </button>
        
        <button 
          className="action-button absent"
          onClick={() => handleSwipe('absent')}
          disabled={students.length === 0}
          title="Absent (Swipe Down)"
        >
          <ArrowDown size={28} color="var(--red)" />
        </button>
        
        <button 
          className="action-button present"
          onClick={() => handleSwipe('present')}
          disabled={students.length === 0}
          title="Present (Swipe Up)"
        >
          <ArrowUp size={28} color="var(--green)" />
        </button>
      </div>
    </div>
  );
};

export default AttendanceSwiper;