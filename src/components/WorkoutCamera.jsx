import React, { useState, useRef, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

const WorkoutCamera = ({ onBack, language, isPro }) => {
  const [user] = useAuthState(auth);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');
  const [repCount, setRepCount] = useState(0);
  const [currentExercise, setCurrentExercise] = useState('push-ups');
  const [formFeedback, setFormFeedback] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const text = {
    en: {
      title: 'AI Form Analysis',
      subtitle: '完璧なフォーム。最大の効果。', // Perfect form. Maximum effect.
      startAnalysis: 'Start Analysis',
      stopAnalysis: 'Stop Analysis', 
      cameraPermission: 'Camera access required for form analysis',
      enableCamera: 'Enable Camera',
      repCounter: 'Rep Counter',
      formCheck: 'Form Check',
      sessionTimer: 'Session Time',
      exercise: 'Exercise',
      feedback: 'AI Feedback',
      noFeedback: 'Keep going! Form looks good.',
      upgradePrompt: 'Upgrade to Pro for advanced AI coaching and detailed form analysis',
      upgradeCta: 'Upgrade Now',
      proFeature: 'Pro Feature - Upgrade Required',
      exercises: {
        'push-ups': 'Push-ups',
        'squats': 'Squats', 
        'planks': 'Planks',
        'lunges': 'Lunges'
      }
    },
    ja: {
      title: 'AIフォーム分析',
      subtitle: 'Perfect form. Maximum effect.',
      startAnalysis: '分析開始',
      stopAnalysis: '分析停止',
      cameraPermission: 'フォーム分析にはカメラアクセスが必要です',
      enableCamera: 'カメラを有効にする',
      repCounter: 'レップカウンター',
      formCheck: 'フォームチェック',
      sessionTimer: 'セッション時間',
      exercise: 'エクササイズ',
      feedback: 'AIフィードバック',
      noFeedback: '続けて！フォームは良好です。',
      upgradePrompt: 'プロにアップグレードして高度なAIコーチングと詳細なフォーム分析を',
      upgradeCta: '今すぐアップグレード',
      proFeature: 'プロ機能 - アップグレードが必要',
      exercises: {
        'push-ups': 'プッシュアップ',
        'squats': 'スクワット',
        'planks': 'プランク', 
        'lunges': 'ランジ'
      }
    }
  };

  const t = text[language];

  useEffect(() => {
    requestCameraPermission();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
        // Simulate rep counting and form feedback (in real app, this would use TensorFlow.js)
        if (Math.random() > 0.7) {
          setRepCount(prev => prev + 1);
        }
        if (isPro && Math.random() > 0.8) {
          const feedbacks = [
            'Lower your hips more',
            'Keep your back straight', 
            'Good form!',
            'Slow down the movement',
            'Engage your core'
          ];
          setFormFeedback(feedbacks[Math.floor(Math.random() * feedbacks.length)]);
        }
      }, 2000);
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
  }, [isRecording, isPro]);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setHasPermission(true);
      setError('');
    } catch (err) {
      console.error('Camera permission denied:', err);
      setError(t.cameraPermission);
      setHasPermission(false);
    }
  };

  const toggleRecording = () => {
    if (!isPro) {
      setError(t.proFeature);
      return;
    }
    setIsRecording(!isRecording);
    if (!isRecording) {
      setRepCount(0);
      setSessionTime(0);
      setFormFeedback('');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#f07a6a08] to-transparent pointer-events-none" />
      <div className="absolute bottom-[-120px] left-[-200px] w-[400px] h-[400px] bg-gradient-radial from-[#aadc7808] to-transparent pointer-events-none" />

      <div className="max-w-[640px] mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="mb-8 animate-[fadeInUp_0.6s_ease_both]">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[rgba(245,240,250,0.45)] hover:text-[rgba(245,240,250,0.92)] transition-colors mb-6"
          >
            <span>←</span> Back to Dashboard
          </button>
          
          <div className="text-xs font-mono uppercase tracking-[0.15em] text-[#f07a6a] opacity-70 mb-4">
            AI Form Coach
          </div>
          <h1 className="text-4xl font-light font-serif text-[rgba(245,240,250,0.92)] mb-2 tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-[rgba(245,240,250,0.45)] font-light">
            {t.subtitle}
          </p>
        </div>

        {/* Pro Feature Notice */}
        {!isPro && (
          <div className="mb-8 animate-[fadeInUp_0.6s_ease_0.15s_both]">
            <div className="bg-[rgba(240,122,106,0.04)] border border-[rgba(240,122,106,0.18)] rounded-2xl p-6 text-center">
              <h3 className="text-lg font-light text-[rgba(245,240,250,0.92)] mb-2">{t.proFeature}</h3>
              <p className="text-sm text-[rgba(245,240,250,0.45)] mb-4">{t.upgradePrompt}</p>
              <button className="bg-[rgba(240,122,106,0.1)] border border-[rgba(240,122,106,0.35)] rounded-full px-7 py-3 text-xs font-mono uppercase tracking-[0.15em] text-[#f07a6a] transition-all duration-200 hover:bg-[rgba(240,122,106,0.18)] hover:border-[rgba(240,122,106,0.6)] hover:transform hover:translate-y-[-1px]">
                {t.upgradeCta}
              </button>
            </div>
          </div>
        )}

        {/* Camera View */}
        <div className="mb-8 animate-[fadeInUp_0.6s_ease_0.3s_both]">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-2xl p-6 relative overflow-hidden">
            {hasPermission ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full aspect-video rounded-xl bg-black ${!isPro ? 'opacity-30' : ''}`}
                />
                
                {/* AI Overlay */}
                {isRecording && isPro && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Pose detection dots (simulated) */}
                    <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-[#aadc78] rounded-full animate-pulse" />
                    <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-[#f07a6a] rounded-full animate-pulse" />
                    <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-[#f07a6a] rounded-full animate-pulse" />
                    
                    {/* Form correction overlay */}
                    {formFeedback && (
                      <div className="absolute top-4 left-4 bg-[rgba(0,0,0,0.8)] text-white px-3 py-2 rounded-lg text-sm animate-[fadeIn_0.4s_ease]">
                        {formFeedback}
                      </div>
                    )}
                  </div>
                )}
                
                {!isPro && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] rounded-xl">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔒</div>
                      <div className="text-sm text-[rgba(245,240,250,0.92)]">{t.proFeature}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-[rgba(245,240,250,0.05)] rounded-xl">
                <div className="text-center">
                  <div className="text-4xl mb-4">📹</div>
                  <p className="text-sm text-[rgba(245,240,250,0.45)] mb-4">{error || t.cameraPermission}</p>
                  <button
                    onClick={requestCameraPermission}
                    className="bg-[rgba(240,122,106,0.1)] border border-[rgba(240,122,106,0.35)] rounded-full px-6 py-2 text-xs font-mono uppercase tracking-[0.15em] text-[#f07a6a] transition-all duration-200 hover:bg-[rgba(240,122,106,0.18)] hover:border-[rgba(240,122,106,0.6)]"
                  >
                    {t.enableCamera}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 animate-[fadeInUp_0.6s_ease_0.45s_both]">
          <div className="flex items-center justify-center gap-4">
            <select
              value={currentExercise}
              onChange={(e) => setCurrentExercise(e.target.value)}
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl px-4 py-2 text-sm text-[rgba(245,240,250,0.92)] focus:border-[rgba(170,220,120,0.45)] focus:bg-[rgba(255,255,255,0.06)] outline-none transition-all"
              disabled={!isPro}
            >
              {Object.entries(t.exercises).map(([key, value]) => (
                <option key={key} value={key} className="bg-[#0b0b0f]">{value}</option>
              ))}
            </select>
            
            <button
              onClick={toggleRecording}
              disabled={!hasPermission}
              className={`px-8 py-3 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording
                  ? 'bg-[rgba(240,122,106,0.2)] border border-[rgba(240,122,106,0.5)] text-[#f07a6a] hover:bg-[rgba(240,122,106,0.3)]'
                  : 'bg-[rgba(170,220,120,0.1)] border border-[rgba(170,220,120,0.35)] text-[#aadc78] hover:bg-[rgba(170,220,120,0.18)] hover:border-[rgba(170,220,120,0.6)]'
              } hover:transform hover:translate-y-[-1px] active:transform active:scale-[0.98]`}
            >
              {isRecording ? t.stopAnalysis : t.startAnalysis}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 animate-[fadeInUp_0.6s_ease_0.6s_both]">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl p-4 text-center">
            <div className="text-2xl font-light text-[#aadc78] mb-1">{repCount}</div>
            <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.45)]">{t.repCounter}</div>
          </div>
          
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl p-4 text-center">
            <div className="text-2xl font-light text-[#f07a6a] mb-1">{formatTime(sessionTime)}</div>
            <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.45)]">{t.sessionTimer}</div>
          </div>
          
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{isRecording && isPro ? '✅' : '⏸️'}</div>
            <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.45)]">{t.formCheck}</div>
          </div>
        </div>

        {/* AI Feedback */}
        {isPro && (
          <div className="mt-8 animate-[fadeInUp_0.6s_ease_0.75s_both]">
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#aadc78] opacity-70 mb-4">
              {t.feedback}
            </div>
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl p-4">
              <p className="text-sm text-[rgba(245,240,250,0.92)]">
                {formFeedback || t.noFeedback}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutCamera;