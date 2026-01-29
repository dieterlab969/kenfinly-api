
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useTranslation } from '@assets/js/contexts/TranslationContext.jsx';
import Layout2 from '../../components/public/Layout2';
import gtmTracking from '../../utils/gtmTracking';

const PomodoroTimer = () => {
  const { t } = useTranslation();
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    gtmTracking.trackPomodoroPageView();
  }, []);

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
    
    // Track session completion
    gtmTracking.trackPomodoroComplete(mode, completedPomodoros + 1);

    if (mode === 'focus') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);

      if (newCount % 4 === 0) {
        setMode('long_break');
        setMinutes(15);
      } else {
        setMode('break');
        setMinutes(5);
      }
      setSeconds(0);
    } else {
      setMode('focus');
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
    const nextActive = !isActive;
    setIsActive(nextActive);
    gtmTracking.trackPomodoroAction(nextActive ? 'start' : 'pause', mode);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    setMinutes(25);
    setSeconds(0);
    setCompletedPomodoros(0);
    gtmTracking.trackPomodoroAction('reset', 'focus');
  };

  const formatTime = (mins, secs) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getModeColor = () => {
    if (mode === 'focus') return 'bg-red-500';
    if (mode === 'break') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getModeLabel = () => {
    return t(`pomodoro.mode.${mode}`);
  };

  return (
    <Layout2>
      <div className="flex flex-col items-center justify-center py-10">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 font-['Montserrat']">{t('pomodoro.title')}</h1>
            <p className="text-gray-500 font-['Lora']">{t('pomodoro.subtitle')}</p>
          </div>

          <div className="mb-8">
            <div className={`${getModeColor()} rounded-2xl p-8 text-white text-center transition-all duration-300`}>
              <div className="text-xl font-semibold mb-4">{getModeLabel()}</div>
              <div className="text-7xl font-bold tracking-tight mb-4">
                {formatTime(minutes, seconds)}
              </div>
              <div className="text-sm opacity-90">
                {t('pomodoro.completed')}: {completedPomodoros} {completedPomodoros === 1 ? t('pomodoro.session') : t('pomodoro.sessions')}
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={toggleTimer}
              className={`${getModeColor()} hover:opacity-90 text-white rounded-full p-4 transition-all duration-200 shadow-lg hover:shadow-xl`}
              aria-label={isActive ? t('pomodoro.action.pause') : t('pomodoro.action.start')}
            >
              {isActive ? <Pause size={32} /> : <Play size={32} />}
            </button>

            <button
              onClick={resetTimer}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-4 transition-all duration-200 shadow-lg hover:shadow-xl"
              aria-label={t('pomodoro.action.reset')}
            >
              <RotateCcw size={32} />
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <h3 className="font-semibold text-gray-700 mb-2">{t('pomodoro.how_it_works')}</h3>
            <ul className="text-sm text-gray-600 space-y-1 font-['Lora']">
              <li>• {t('pomodoro.step1')}</li>
              <li>• {t('pomodoro.step2')}</li>
              <li>• {t('pomodoro.step3')}</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout2>
  );
};

export default PomodoroTimer;
