import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const LiveWorkout = ({ onBack, language, isPro }) => {
  const [user] = useAuthState(auth);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentSet, setCurrentSet] = useState(1);
  const [totalSets] = useState(3);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(30);
  const intervalRef = useRef(null);
  const synthRef = useRef(null);

  const exercises = [
    { name: 'Push-ups', duration: 45, instructions: 'Keep your back straight and core engaged' },
    { name: 'Squats', duration: 45, instructions: 'Lower until thighs are parallel to ground' },
    { name: 'Mountain Climbers', duration: 30, instructions: 'Alternate legs quickly, keep core tight' },
    { name: 'Plank', duration: 60, instructions: 'Hold position, breathe steadily' },
    { name: 'Jumping Jacks', duration: 30, instructions: 'Land softly, keep arms extended' },
    { name: 'Lunges', duration: 45, instructions: 'Step forward, lower back knee toward ground' }
  ];

  const text = {
    en: {
      title: 'Live Workout Session',
      subtitle: '集中と持続。今この瞬間。', // Focus and endurance. This moment.
      startWorkout: 'Start Workout',
      pauseWorkout: 'Pause',
      resumeWorkout: 'Resume', 
      stopWorkout: 'Stop Workout',
      nextExercise: 'Next Exercise',
      restTime: 'Rest Time',
      set: 'Set',
      of: 'of',
      exercise: 'Exercise',
      timeRemaining: 'Time Remaining',
      workoutComplete: 'Workout Complete!',
      totalTime: 'Total Time',
      exercisesCompleted: 'Exercises Completed',
      wellDone: 'Well done! Your workout has been saved.',
      voiceCoaching: 'Voice Coaching',
      enabled: 'Enabled',
      disabled: 'Disabled',
      proFeature: 'Pro Feature',
      upgradeForVoice: 'Upgrade to Pro for voice coaching',
      instructions: 'Instructions',
      getReady: 'Get Ready',
      go: 'Go!',
      rest: 'Rest',
      goodJob: 'Good job!',
      keepGoing: 'Keep going!',
      almostDone: 'Almost done!',
      finished: 'Exercise finished!'
    },
    ja: {
      title: 'ライブワークアウト',
      subtitle: 'Focus and endurance. This moment.',
      startWorkout: 'ワークアウト開始',
      pauseWorkout: '一時停止',
      resumeWorkout: '再開',
      stopWorkout: 'ワークアウト終了',
      nextExercise: '次のエクササイズ',
      restTime: '休憩時間',
      set: 'セット',
      of: '/',
      exercise: 'エクササイズ',
      timeRemaining: '残り時間',
      workoutComplete: 'ワークアウト完了！',
      totalTime: '総時間',
      exercisesCompleted: '完了エクササイズ',
      wellDone: 'よくできました！ワークアウトが保存されました。',
      voiceCoaching: 'ボイスコーチング',
      enabled: '有効',
      disabled: '無効',
      proFeature: 'プロ機能',
      upgradeForVoice: 'ボイスコーチングはプロ機能です',
      instructions: '説明',
      getReady: '準備してください',
      go: '開始！',
      rest: '休憩',
      goodJob: 'よくできました！',
      keepGoing: '続けて！',
      almostDone: 'もう少し！',
      finished: 'エクササイズ終了！'
    }
  };

  const t = text[language];
  const [voiceEnabled, setVoiceEnabled] = useState(isPro);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = (message) => {
    if (!isPro || !voiceEnabled || !synthRef.current) return;
    
    synthRef.current.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
        
        if (isResting) {
          setRestTime(prev => {
            if (prev <= 1) {
              setIsResting(false);
              setCurrentSet(prev => prev + 1);
              setTimeLeft(exercises[currentExercise].duration);
              speak(`${t.set} ${currentSet + 1}. ${t.getReady}`);
              return 30;
            }
            return prev - 1;
          });
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              speak(t.finished);
              if (currentSet < totalSets) {
                setIsResting(true);
                setRestTime(30);
                speak(`${t.goodJob} ${t.rest}`);
              } else if (currentExercise < exercises.length - 1) {
                setCurrentExercise(prev => prev + 1);
                setCurrentSet(1);
                setTimeLeft(exercises[currentExercise + 1].duration);
                speak(`${t.nextExercise}: ${exercises[currentExercise + 1].name}`);
              } else {
                // Workout complete
                setIsCompleted(true);
                setIsActive(false);
                speak(t.workoutComplete);
                saveWorkout();
              }
              return exercises[currentExercise].duration;
            }
            
            // Voice encouragements
            if (prev === 30 && isPro) speak(t.keepGoing);
            if (prev === 10 && isPro) speak(t.almostDone);
            
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, isResting, currentExercise, currentSet, exercises, isPro, voiceEnabled]);

  const startWorkout = () => {
    setIsActive(true);
    setTimeLeft(exercises[0].duration);
    speak(`${t.getReady} ${exercises[0].name}. ${t.go}`);
  };

  const pauseWorkout = () => {
    setIsPaused(!isPaused);
    if (synthRef.current) synthRef.current.cancel();
  };

  const stopWorkout = () => {
    setIsActive(false);
    setIsPaused(false);
    if (synthRef.current) synthRef.current.cancel();
    if (workoutTime > 0) {
      saveWorkout();
    }
  };

  const saveWorkout = async () => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'workouts'), {
        userId: user.uid,
        name: 'Quick Workout',
        duration: Math.floor(workoutTime / 60),
        exercises: currentExercise + 1,
        completed: isCompleted,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = isResting 
    ? ((30 - restTime) / 30) * 100
    : ((exercises[currentExercise].duration - timeLeft) / exercises[currentExercise].duration) * 100;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] relative overflow-hidden">
        <div className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#aadc7808] to-transparent pointer-events-none" />
        
        <div className="max-w-[640px] mx-auto px-6 py-12 relative z-10 text-center">
          <div className="animate-[fadeInUp_0.6s_ease_both]">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-4xl font-light font-serif text-[rgba(245,240,250,0.92)] mb-4">
              {t.workoutComplete}
            </h1>
            <p className="text-lg text-[rgba(245,240,250,0.45)] mb-8">
              {t.wellDone}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl p-4">
                <div className="text-2xl font-light text-[#aadc78] mb-1">{formatTime(workoutTime)}</div>
                <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.45)]">{t.totalTime}</div>
              </div>
              
              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl p-4">
                <div className="text-2xl font-light text-[#f07a6a] mb-1">{exercises.length}</div>
                <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.45)]">{t.exercisesCompleted}</div>
              </div>
            </div>
            
            <button
              onClick={onBack}
              className="bg-[rgba(170,220,120,0.1)] border border-[rgba(170,220,120,0.35)] rounded-full px-8 py-3 text-sm font-mono uppercase tracking-[0.15em] text-[#aadc78] transition-all duration-200 hover:bg-[rgba(170,220,120,0.18)] hover:border-[rgba(170,220,120,0.6)] hover:transform hover:translate-y-[-1px]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0f] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#f07a6a08] to-transparent pointer-events-none" />
      <div className="absolute bottom-[-120px] right-[-200px] w-[400px] h-[400px] bg-gradient-radial from-[#aadc7808] to-transparent pointer-events-none" />

      <div className="max-w-[640px] mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 animate-[fadeInUp_0.6s_ease_both]">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[rgba(245,240,250,0.45)] hover:text-[rgba(245,240,250,0.92)] transition-colors mb-6"
          >
            <span>←</span> Back to Dashboard
          </button>
          
          <div className="text-xs font-mono uppercase tracking-[0.15em] text-[#f07a6a] opacity-70 mb-4">
            Workout Session
          </div>
          <h1 className="text-3xl font-light font-serif text-[rgba(245,240,250,0.92)] mb-2 tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-[rgba(245,240,250,0.45)] font-light">
            {t.subtitle}
          </p>
        </div>

        {/* Voice Coaching Toggle */}
        <div className="mb-8 animate-[fadeInUp_0.6s_ease_0.15s_both]">
          <div className="flex items-center justify-between bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl p-4">
            <div>
              <span className="text-sm text-[rgba(245,240,250,0.92)]">{t.voiceCoaching}</span>
              {!isPro && (
                <div className="text-xs text-[rgba(245,240,250,0.45)] mt-1">{t.upgradeForVoice}</div>
              )}
            </div>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              disabled={!isPro}
              className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-[0.1em] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                voiceEnabled && isPro
                  ? 'bg-[rgba(170,220,120,0.2)] border border-[rgba(170,220,120,0.5)] text-[#aadc78]'
                  : 'bg-[rgba(245,240,250,0.1)] border border-[rgba(245,240,250,0.2)] text-[rgba(245,240,250,0.45)]'
              }`}
            >
              {voiceEnabled && isPro ? t.enabled : t.disabled}
            </button>
          </div>
        </div>

        {/* Main Exercise Display */}
        <div className="mb-8 animate-[fadeInUp_0.6s_ease_0.3s_both]">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-2xl p-8 text-center relative overflow-hidden">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#f07a6a] to-[#aadc78] transition-all duration-1000" 
                 style={{ width: `${progressPercentage}%` }} />
            
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#aadc78] opacity-70 mb-4">
              {isResting ? t.restTime : `${t.exercise} ${currentExercise + 1}/${exercises.length}`}
            </div>
            
            <h2 className="text-3xl font-light font-serif text-[rgba(245,240,250,0.92)] mb-4">
              {isResting ? t.rest : exercises[currentExercise].name}
            </h2>
            
            <div className="text-6xl font-light text-[#f07a6a] mb-4">
              {isResting ? restTime : timeLeft}
            </div>
            
            <div className="text-sm text-[rgba(245,240,250,0.45)] mb-6">
              {isResting ? `${t.set} ${currentSet}/${totalSets}` : exercises[currentExercise].instructions}
            </div>
            
            {!isResting && (
              <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.2)]">
                {t.set} {currentSet} {t.of} {totalSets}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 animate-[fadeInUp_0.6s_ease_0.45s_both]">
          <div className="flex items-center justify-center gap-4">
            {!isActive ? (
              <button
                onClick={startWorkout}
                className="bg-[rgba(170,220,120,0.1)] border border-[rgba(170,220,120,0.35)] rounded-full px-8 py-3 text-sm font-mono uppercase tracking-[0.15em] text-[#aadc78] transition-all duration-200 hover:bg-[rgba(170,220,120,0.18)] hover:border-[rgba(170,220,120,0.6)] hover:transform hover:translate-y-[-1px]"
              >
                {t.startWorkout}
              </button>
            ) : (
              <>
                <button
                  onClick={pauseWorkout}
                  className="bg-[rgba(245,240,250,0.1)] border border-[rgba(245,240,250,0.2)] rounded-full px-6 py-3 text-sm font-mono uppercase tracking-[0.15em] text-[rgba(245,240,250,0.92)] transition-all duration-200 hover:bg-[rgba(245,240,250,0.15)] hover:transform hover:translate-y-[-1px]"
                >
                  {isPaused ? t.resumeWorkout : t.pauseWorkout}
                </button>
                
                <button
                  onClick={stopWorkout}
                  className="bg-[rgba(240,122,106,0.1)] border border-[rgba(240,122,106,0.35)] rounded-full px-6 py-3 text-sm font-mono uppercase tracking-[0.15em] text-[#f07a6a] transition-all duration-200 hover:bg-[rgba(240,122,106,0.18)] hover:border-[rgba(240,122,106,0.6)] hover:transform hover:translate-y-[-1px]"
                >
                  {t.stopWorkout}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-2 gap-4 animate-[fadeInUp_0.6s_ease_0.6s_both]">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl p-4 text-center">
            <div className="text-lg font-light text-[rgba(245,240,250,0.92)] mb-1">{formatTime(workoutTime)}</div>
            <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.45)]">{t.totalTime}</div>
          </div>
          
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl p-4 text-center">
            <div className="text-lg font-light text-[rgba(245,240,250,0.92)] mb-1">{currentExercise + 1}/{exercises.length}</div>
            <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.45)]">{t.exercise}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveWorkout;