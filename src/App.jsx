import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { checkSubscriptionStatus, getOfferings, purchasePackage, initializeRevenueCat } from './lib/revenuecat';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import WorkoutCamera from './components/WorkoutCamera';
import LiveWorkout from './components/LiveWorkout';
import WorkoutPlan from './components/WorkoutPlan';
import SubscriptionModal from './components/SubscriptionModal';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [language, setLanguage] = useState('en');
  const [isPro, setIsPro] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          // Initialize RevenueCat with user ID
          await initializeRevenueCat(user.uid);
          // Check entitlements
          const subscriptionStatus = await checkSubscriptionStatus();
          setIsPro(subscriptionStatus.isPro || subscriptionStatus.isPremium);
        } catch (error) {
          console.error('Failed to check subscription status:', error);
          setError('Failed to check subscription status');
        }
      } else {
        // Anonymous sign-in for new users
        try {
          await signInAnonymously(auth);
        } catch (error) {
          setError('Failed to authenticate');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePremiumFeature = () => {
    if (!isPro) {
      setShowSubscription(true);
      return false;
    }
    return true;
  };

  const handleSubscribe = async (packageId) => {
    try {
      const offering = await getOfferings();
      if (!offering) {
        throw new Error('No offerings available');
      }
      
      const pkg = offering.availablePackages.find(p => p.identifier === packageId);
      if (pkg) {
        const result = await purchasePackage(pkg);
        if (result.success) {
          setIsPro(result.isPro || result.isPremium);
          setShowSubscription(false);
        } else if (!result.cancelled) {
          throw new Error(result.error || 'Purchase failed');
        }
      } else {
        throw new Error('Package not found');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Subscription failed: ' + error.message);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ja' : 'en');
  };

  const text = {
    en: {
      tagline: 'Transform your training',
      subtitle: 'AI-powered form analysis and personal coaching',
      japaneseTagline: 'あなたの可能性を、解き放て。',
      nav: {
        dashboard: 'Dashboard',
        workout: 'Live Workout',
        plan: 'My Plan',
        camera: 'Form Check'
      },
      premium: 'Premium',
      freeTier: 'Free Tier',
      sessionsLeft: 'sessions left this week'
    },
    ja: {
      tagline: 'トレーニングを変革する',
      subtitle: 'AIパワード姿勢分析とパーソナルコーチング',
      japaneseTagline: 'あなたの可能性を、解き放て。',
      nav: {
        dashboard: 'ダッシュボード',
        workout: 'ライブワークアウト',
        plan: 'マイプラン',
        camera: 'フォームチェック'
      },
      premium: 'プレミアム',
      freeTier: 'フリー',
      sessionsLeft: '今週の残りセッション'
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading WorkoutWise Pro...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth language={language} toggleLanguage={toggleLanguage} text={text} />;
  }

  return (
    <div className="app">
      {/* Background glows */}
      <div className="bg-glow bg-glow-top"></div>
      <div className="bg-glow bg-glow-bottom"></div>
      
      {/* Header */}
      <header className="app-header">
        <div className="header-top">
          <div className="brand">
            <h1 className="brand-title">WorkoutWise Pro</h1>
            <p className="brand-subtitle">{text[language].japaneseTagline}</p>
          </div>
          
          <div className="header-controls">
            <button 
              className="lang-toggle"
              onClick={toggleLanguage}
              title="Toggle language"
            >
              {language.toUpperCase()}
            </button>
            
            <div className="subscription-status">
              {isPro ? (
                <span className="status-badge status-pro">
                  <span className="status-dot"></span>
                  {text[language].premium}
                </span>
              ) : (
                <span className="status-badge status-free">
                  <span className="status-dot"></span>
                  {text[language].freeTier}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <nav className="main-nav">
          <button 
            className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            {text[language].nav.dashboard}
          </button>
          <button 
            className={`nav-button ${currentView === 'camera' ? 'active' : ''}`}
            onClick={() => setCurrentView('camera')}
          >
            {text[language].nav.camera}
          </button>
          <button 
            className={`nav-button ${currentView === 'workout' ? 'active' : ''}`}
            onClick={() => setCurrentView('workout')}
          >
            {text[language].nav.workout}
          </button>
          <button 
            className={`nav-button ${currentView === 'plan' ? 'active' : ''}`}
            onClick={() => setCurrentView('plan')}
          >
            {text[language].nav.plan}
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main className="app-main">
        {currentView === 'dashboard' && (
          <Dashboard 
            language={language} 
            text={text}
            isPro={isPro}
            onPremiumFeature={handlePremiumFeature}
            onNavigate={setCurrentView}
          />
        )}
        {currentView === 'camera' && (
          <WorkoutCamera 
            language={language}
            text={text}
            isPro={isPro}
            onPremiumFeature={handlePremiumFeature}
          />
        )}
        {currentView === 'workout' && (
          <LiveWorkout 
            language={language}
            text={text}
            isPro={isPro}
            onPremiumFeature={handlePremiumFeature}
          />
        )}
        {currentView === 'plan' && (
          <WorkoutPlan 
            language={language}
            text={text}
            isPro={isPro}
            onPremiumFeature={handlePremiumFeature}
          />
        )}
      </main>

      {/* Subscription modal */}
      {showSubscription && (
        <SubscriptionModal
          language={language}
          text={text}
          onSubscribe={handleSubscribe}
          onClose={() => setShowSubscription(false)}
        />
      )}

      {/* Error display */}
      {error && (
        <div className="error-toast">
          <p>{error}</p>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Feedback widget */}
      <div className={`feedback-widget ${showFeedback ? 'expanded' : ''}`}>
        {showFeedback ? (
          <div className="feedback-form">
            <div className="feedback-header">
              <span className="feedback-title">フィードバック</span>
              <button className="feedback-close" onClick={() => setShowFeedback(false)}>×</button>
            </div>
            <textarea 
              placeholder="How can we improve WorkoutWise Pro?"
              className="feedback-input"
              rows="3"
            ></textarea>
            <div className="feedback-actions">
              <button className="pill-button feedback-submit">Send</button>
            </div>
          </div>
        ) : (
          <button 
            className="feedback-trigger"
            onClick={() => setShowFeedback(true)}
            title="Send feedback"
          >
            💬
          </button>
        )}
      </div>
    </div>
  );
}

export default App;