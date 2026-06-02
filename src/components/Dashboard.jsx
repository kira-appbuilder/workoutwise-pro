import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { checkEntitlements } from '../lib/revenuecat';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import WorkoutCamera from './WorkoutCamera';
import LiveWorkout from './LiveWorkout';
import WorkoutPlan from './WorkoutPlan';
import SubscriptionModal from './SubscriptionModal';

const Dashboard = ({ language, toggleLanguage }) => {
  const [user] = useAuthState(auth);
  const [isPro, setIsPro] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, weekStreak: 0, avgDuration: 0 });
  const [activeView, setActiveView] = useState('dashboard');
  const [showSubscription, setShowSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (user) {
        const hasEntitlement = await checkEntitlements();
        setIsPro(hasEntitlement);
      }
      setLoading(false);
    };
    checkSubscription();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const workoutsRef = collection(db, 'workouts');
    const recentQuery = query(
      workoutsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(recentQuery, (snapshot) => {
      const workouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentWorkouts(workouts);
      
      // Calculate stats
      const totalWorkouts = workouts.length;
      const avgDuration = workouts.length > 0 
        ? workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / workouts.length 
        : 0;
      
      setStats({ totalWorkouts, weekStreak: 3, avgDuration: Math.round(avgDuration) });
    });

    return unsubscribe;
  }, [user]);

  const text = {
    en: {
      title: 'Your Training Ground',
      subtitle: '力と規律。あなたの道。', // Strength and discipline. Your path.
      startWorkout: 'Start Workout',
      quickSession: 'Quick Session',
      customPlan: 'Custom Plan',
      exerciseLibrary: 'Exercise Library',
      recentSessions: 'Recent Sessions',
      weeklyProgress: 'Weekly Progress',
      totalWorkouts: 'Total Workouts',
      weekStreak: 'Week Streak',
      avgDuration: 'Avg Duration',
      upgradePrompt: 'Upgrade to Pro for unlimited sessions and advanced AI coaching',
      upgradeCta: 'Upgrade Now',
      freeSessionsLeft: 'Free sessions this week:',
      mins: 'mins',
      proFeature: 'Pro Feature',
      locked: 'Locked'
    },
    ja: {
      title: 'あなたのトレーニング場',
      subtitle: 'Strength and discipline. Your path.',
      startWorkout: 'ワークアウト開始',
      quickSession: 'クイックセッション', 
      customPlan: 'カスタムプラン',
      exerciseLibrary: 'エクササイズライブラリ',
      recentSessions: '最近のセッション',
      weeklyProgress: '週間進捗',
      totalWorkouts: '総ワークアウト数',
      weekStreak: '週間ストリーク',
      avgDuration: '平均時間',
      upgradePrompt: 'プロにアップグレードして無制限セッションと高度なAIコーチングを',
      upgradeCta: '今すぐアップグレード',
      freeSessionsLeft: '今週の無料セッション残り:',
      mins: '分',
      proFeature: 'プロ機能',
      locked: 'ロック済み'
    }
  };

  const t = text[language];
  const freeSessionsUsed = 2;
  const freeSessionsLimit = 5;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f07a6a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeView === 'camera') {
    return <WorkoutCamera onBack={() => setActiveView('dashboard')} language={language} isPro={isPro} />;
  }

  if (activeView === 'workout') {
    return <LiveWorkout onBack={() => setActiveView('dashboard')} language={language} isPro={isPro} />;
  }

  if (activeView === 'plans') {
    return <WorkoutPlan onBack={() => setActiveView('dashboard')} language={language} isPro={isPro} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0b0f] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#f07a6a08] to-transparent pointer-events-none" />
      <div className="absolute bottom-[-120px] right-[-200px] w-[400px] h-[400px] bg-gradient-radial from-[#aadc7808] to-transparent pointer-events-none" />

      <div className="max-w-[640px] mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="mb-12 animate-[fadeInUp_0.6s_ease_both]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-mono uppercase tracking-[0.15em] text-[#f07a6a] opacity-70">
              WorkoutWise Pro
            </div>
            <button
              onClick={toggleLanguage}
              className="text-xs font-mono uppercase tracking-[0.15em] text-[#aadc78] opacity-70 hover:opacity-100 transition-opacity"
            >
              {language === 'en' ? 'JA' : 'EN'}
            </button>
          </div>
          <h1 className="text-4xl font-light font-serif text-[rgba(245,240,250,0.92)] mb-2 tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-[rgba(245,240,250,0.45)] font-light">
            {t.subtitle}
          </p>
        </div>

        {/* Subscription Status */}
        {!isPro && (
          <div className="mb-8 animate-[fadeInUp_0.6s_ease_0.15s_both]">
            <div className="bg-[rgba(240,122,106,0.04)] border border-[rgba(240,122,106,0.18)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[rgba(245,240,250,0.92)]">{t.freeSessionsLeft}</span>
                <span className="text-lg font-light text-[#f07a6a]">{freeSessionsLimit - freeSessionsUsed}/{freeSessionsLimit}</span>
              </div>
              <div className="w-full bg-[rgba(245,240,250,0.1)] rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-[#f07a6a] to-[#aadc78] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((freeSessionsLimit - freeSessionsUsed) / freeSessionsLimit) * 100}%` }}
                />
              </div>
              <p className="text-sm text-[rgba(245,240,250,0.45)] mb-4">{t.upgradePrompt}</p>
              <button
                onClick={() => setShowSubscription(true)}
                className="bg-[rgba(240,122,106,0.1)] border border-[rgba(240,122,106,0.35)] rounded-full px-7 py-3 text-xs font-mono uppercase tracking-[0.15em] text-[#f07a6a] transition-all duration-200 hover:bg-[rgba(240,122,106,0.18)] hover:border-[rgba(240,122,106,0.6)] hover:transform hover:translate-y-[-1px] active:transform active:scale-[0.98]"
              >
                {t.upgradeCta}
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-12 animate-[fadeInUp_0.6s_ease_0.3s_both]">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#aadc78] opacity-70 mb-6">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveView('workout')}
              className="bg-[rgba(240,122,106,0.04)] border border-[rgba(240,122,106,0.18)] rounded-2xl p-6 text-left transition-all duration-300 hover:border-[rgba(240,122,106,0.45)] hover:bg-[rgba(240,122,106,0.06)] hover:transform hover:translate-y-[-1px] active:transform active:scale-[0.98] group"
            >
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="text-lg font-light text-[rgba(245,240,250,0.92)] mb-1">{t.startWorkout}</h3>
              <p className="text-sm text-[rgba(245,240,250,0.45)]">{t.quickSession}</p>
            </button>
            
            <button
              onClick={() => !isPro ? setShowSubscription(true) : setActiveView('camera')}
              className="bg-[rgba(170,220,120,0.04)] border border-[rgba(170,220,120,0.18)] rounded-2xl p-6 text-left transition-all duration-300 hover:border-[rgba(170,220,120,0.45)] hover:bg-[rgba(170,220,120,0.06)] hover:transform hover:translate-y-[-1px] active:transform active:scale-[0.98] group relative"
            >
              <div className="text-2xl mb-2">📱</div>
              <h3 className="text-lg font-light text-[rgba(245,240,250,0.92)] mb-1">Form Analysis</h3>
              <p className="text-sm text-[rgba(245,240,250,0.45)]">AI Camera Coach</p>
              {!isPro && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-[rgba(170,220,120,0.06)] border border-[rgba(170,220,120,0.15)] rounded-full px-2 py-1">
                  <span className="text-xs font-mono text-[rgba(170,220,120,0.5)] tracking-[0.1em]">{t.proFeature}</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="mb-12 animate-[fadeInUp_0.6s_ease_0.45s_both]">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveView('plans')}
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-2xl p-4 text-left transition-all duration-300 hover:border-[rgba(245,240,250,0.2)] hover:bg-[rgba(255,255,255,0.06)] hover:transform hover:translate-y-[-1px]"
            >
              <div className="text-lg mb-1">📋</div>
              <span className="text-sm text-[rgba(245,240,250,0.92)]">{t.customPlan}</span>
            </button>
            
            <button className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-2xl p-4 text-left transition-all duration-300 hover:border-[rgba(245,240,250,0.2)] hover:bg-[rgba(255,255,255,0.06)] hover:transform hover:translate-y-[-1px]">
              <div className="text-lg mb-1">📚</div>
              <span className="text-sm text-[rgba(245,240,250,0.92)]">{t.exerciseLibrary}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-12 animate-[fadeInUp_0.6s_ease_0.6s_both]">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#f07a6a] opacity-70 mb-6">
            {t.weeklyProgress}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-light text-[#f07a6a] mb-1">{stats.totalWorkouts}</div>
              <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.45)]">{t.totalWorkouts}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-[#aadc78] mb-1">{stats.weekStreak}</div>
              <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.45)]">{t.weekStreak}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-[rgba(245,240,250,0.92)] mb-1">{stats.avgDuration}</div>
              <div className="text-xs font-mono uppercase tracking-[0.1em] text-[rgba(245,240,250,0.45)]">{t.mins}</div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        {recentWorkouts.length > 0 && (
          <div className="animate-[fadeInUp_0.6s_ease_0.75s_both]">
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#aadc78] opacity-70 mb-6">
              {t.recentSessions}
            </div>
            <div className="space-y-3">
              {recentWorkouts.map((workout, index) => (
                <div 
                  key={workout.id}
                  className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,240,250,0.1)] rounded-xl p-4 relative overflow-hidden"
                >
                  {/* Left border accent */}
                  <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[#f07a6a] to-[#aadc78] opacity-40" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-light text-[rgba(245,240,250,0.92)] mb-1">
                        {workout.name || 'Quick Workout'}
                      </div>
                      <div className="text-xs text-[rgba(245,240,250,0.45)]">
                        {workout.duration || 25} {t.mins} • {workout.exercises || 8} exercises
                      </div>
                    </div>
                    <div className="text-xs font-mono text-[rgba(245,240,250,0.2)]">
                      {new Date(workout.createdAt?.toDate()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Divider */}
        <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-[rgba(245,240,250,0.25)] to-transparent mx-auto my-8" />
      </div>

      {showSubscription && (
        <SubscriptionModal 
          onClose={() => setShowSubscription(false)} 
          language={language}
        />
      )}
    </div>
  );
};

export default Dashboard;