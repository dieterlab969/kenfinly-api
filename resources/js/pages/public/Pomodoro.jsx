
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const PomodoroTimer = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('Focus');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            handleSessionComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const handleSessionComplete = () => {
    playNotificationSound();
    setIsActive(false);

    if (mode === 'Focus') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);

      if (newCount % 4 === 0) {
        setMode('Long Break');
        setMinutes(15);
      } else {
        setMode('Break');
        setMinutes(5);
      }
      setSeconds(0);
    } else {
      setMode('Focus');
      setMinutes(25);
      setSeconds(0);
    }
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode('Focus');
    setMinutes(25);
    setSeconds(0);
    setCompletedPomodoros(0);
  };

  const formatTime = (mins, secs) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getModeColor = () => {
    if (mode === 'Focus') return 'bg-red-500';
    if (mode === 'Break') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getModeTextColor = () => {
    if (mode === 'Focus') return 'text-red-500';
    if (mode === 'Break') return 'text-green-500';
    return 'text-blue-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pomodoro Timer</h1>
          <p className="text-gray-500">Stay focused and productive</p>
        </div>

        <div className="mb-8">
          <div className={`${getModeColor()} rounded-2xl p-8 text-white text-center transition-all duration-300`}>
            <div className="text-xl font-semibold mb-4">{mode}</div>
            <div className="text-7xl font-bold tracking-tight mb-4">
              {formatTime(minutes, seconds)}
            </div>
            <div className="text-sm opacity-90">
              Completed: {completedPomodoros} {completedPomodoros === 1 ? 'session' : 'sessions'}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={toggleTimer}
            className={`${getModeColor()} hover:opacity-90 text-white rounded-full p-4 transition-all duration-200 shadow-lg hover:shadow-xl`}
            aria-label={isActive ? 'Pause' : 'Start'}
          >
            {isActive ? <Pause size={32} /> : <Play size={32} />}
          </button>

          <button
            onClick={resetTimer}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full p-4 transition-all duration-200 shadow-lg hover:shadow-xl"
            aria-label="Reset"
          >
            <RotateCcw size={32} />
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <h3 className="font-semibold text-gray-700 mb-2">How it works</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Focus for 25 minutes</li>
            <li>• Take a 5-minute break</li>
            <li>• After 4 sessions, take a 15-minute break</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
