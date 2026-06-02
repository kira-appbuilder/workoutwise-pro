import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { checkEntitlements } from '../lib/revenuecat';
import { Play, Lock, Star, TrendingUp, Calendar, Target, Clock, Zap } from 'lucide-react';

const WorkoutPlan = ({ user, onStartWorkout, onShowSubscription }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userGoal, setUserGoal] = useState('strength');
  const [fitnessLevel, setFitnessLevel] = useState('beginner');
  const [hasPro, setHasPro] = useState(false);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  const translations = {
    en: {
      title: 'Your Workout Journey',
      subtitle: '運動の道。あなたのペース。',
      goal: 'FITNESS GOAL',
      level: 'FITNESS LEVEL',
      strength: 'Strength Building',
      cardio: 'Cardio Endurance', 
      flexibility: 'Flexibility',
      weight_loss: 'Weight Loss',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      customPlans: 'Custom Workout Plans',
      basicPlans: 'Recommended Workouts',
      startWorkout: 'Start Workout',
      createCustom: 'Create Custom Plan',
      proOnly: 'PRO ONLY',
      premiumOnly: 'PREMIUM',
      unlock: 'Unlock Premium',
      exercises: 'exercises',
      minutes: 'min',
      difficulty: 'Difficulty',
      equipment: 'Equipment',
      feedback: 'Share Feedback',
      error: 'Report Issue'
    },
    ja: {
      title: 'あなたのワークアウト',
      subtitle: 'Your fitness path, perfectly crafted.',
      goal: 'フィットネス目標',
      level: 'フィットネスレベル',
      strength: '筋力向上',
      cardio: '有酸素運動',
      flexibility: '柔軟性',
      weight_loss: '減量',
      beginner: '初心者',
      intermediate: '中級者', 
      advanced: '上級者',
      customPlans: 'カスタムプラン',
      basicPlans: 'おすすめワークアウト',
      startWorkout: 'ワークアウト開始',
      createCustom: 'カスタムプラン作成',
      proOnly: 'プロのみ',
      premiumOnly: 'プレミアム',
      unlock: 'プレミアム解除',
      exercises: '種目',
      minutes: '分',
      difficulty: '難易度',
      equipment: '器具',
      feedback: 'フィードバック',
      error: '問題を報告'
    }
  };

  const t = translations[language];

  const workoutPlans = {
    beginner: {
      strength: {
        name: 'Foundation Builder',
        exercises: 8,
        duration: 25,
        description: 'Basic bodyweight movements to build strength foundation',
        equipment: 'Bodyweight only',
        difficulty: 2
      },
      cardio: {
        name: 'Cardio Starter',
        exercises: 6,
        duration: 20,
        description: 'Low-impact cardio to improve endurance gradually',
        equipment: 'None required',
        difficulty: 2
      }
    },
    intermediate: {
      strength: {
        name: 'Power Building',
        exercises: 12,
        duration: 35,
        description: 'Compound movements with progressive overload',
        equipment: 'Dumbbells',
        difficulty: 3
      },
      cardio: {
        name: 'HIIT Fusion',
        exercises: 10,
        duration: 30,
        description: 'High-intensity intervals for maximum calorie burn',
        equipment: 'Minimal',
        difficulty: 4
      }
    },
    advanced: {
      strength: {
        name: 'Elite Performance',
        exercises: 15,
        duration: 45,
        description: 'Advanced techniques for peak strength development',
        equipment: 'Full gym',
        difficulty: 5,
        premium: true
      },
      cardio: {
        name: 'Athlete Conditioning',
        exercises: 12,
        duration: 40,
        description: 'Sport-specific conditioning for peak performance',
        equipment: 'Varied',
        difficulty: 5,
        premium: true
      }
    }
  };

  useEffect(() => {
    checkUserSubscription();
    loadWorkoutPlans();
  }, []);

  const checkUserSubscription = async () => {
    try {
      const pro = await checkEntitlements();
      setHasPro(pro);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadWorkoutPlans = async () => {
    setLoading(true);
    try {
      // Load basic plans from workoutPlans object
      const levelPlans = workoutPlans[fitnessLevel] || {};
      const availablePlans = Object.entries(levelPlans)
        .filter(([goal, plan]) => goal === userGoal)
        .map(([goal, plan]) => ({ ...plan, id: `${fitnessLevel}-${goal}`, type: 'basic' }));
      
      setPlans(availablePlans);
      if (availablePlans.length > 0) {
        setSelectedPlan(availablePlans[0]);
      }
    } catch (error) {
      console.error('Error loading workout plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = (plan) => {
    if (plan.premium && !hasPro) {
      onShowSubscription();
      return;
    }
    onStartWorkout(plan);
  };

  const handleCreateCustom = () => {
    if (!hasPro) {
      onShowSubscription();
      return;
    }
    // Navigate to custom workout builder
  };

  const submitFeedback = async (feedback) => {
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user?.uid,
        component: 'WorkoutPlan',
        feedback,
        timestamp: new Date(),
        type: 'feedback'
      });
      setShowFeedback(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const reportError = async (error) => {
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user?.uid,
        component: 'WorkoutPlan',
        error,
        timestamp: new Date(),
        type: 'error'
      });
    } catch (error) {
      console.error('Error reporting issue:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-kira-text-secondary">Loading your workout plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0b0b0f' }}>
      {/* Background Glow Effects */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 -translate-y-32 w-96 h-96 opacity-20 pointer-events-none">
        <div className="w-full h-full rounded-full" style={{
          background: 'radial-gradient(ellipse, rgba(240, 122, 106, 0.15) 0%, transparent 70%)'
        }}></div>
      </div>
      <div className="fixed bottom-0 right-1/4 transform translate-y-32 w-80 h-80 opacity-15 pointer-events-none">
        <div className="w-full h-full rounded-full" style={{
          background: 'radial-gradient(ellipse, rgba(170, 220, 120, 0.12) 0%, transparent 70%)'
        }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-mono uppercase tracking-wider" style={{
              color: 'rgba(240, 122, 106, 0.7)',
              fontFamily: 'Space Mono, monospace',
              letterSpacing: '0.15em'
            }}>Workout Plans</div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
                className="px-3 py-1 rounded-full border text-xs font-mono uppercase tracking-wider transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(240, 122, 106, 0.1)',
                  borderColor: 'rgba(240, 122, 106, 0.35)',
                  color: 'rgba(240, 122, 106, 0.9)',
                  fontFamily: 'Space Mono, monospace'
                }}
              >
                {language.toUpperCase()}
              </button>
              
              <button 
                onClick={() => setShowFeedback(true)}
                className="px-3 py-1 rounded-full border text-xs font-mono uppercase tracking-wider transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(170, 220, 120, 0.1)',
                  borderColor: 'rgba(170, 220, 120, 0.35)',
                  color: 'rgba(170, 220, 120, 0.9)',
                  fontFamily: 'Space Mono, monospace'
                }}
              >
                {t.feedback}
              </button>
            </div>
          </div>
          
          <h1 className="text-5xl mb-3" style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 300,
            color: 'rgba(245, 240, 250, 0.92)',
            letterSpacing: '-0.02em'
          }}>
            {t.title}
          </h1>
          <p className="text-lg" style={{
            color: 'rgba(245, 240, 250, 0.45)',
            fontFamily: 'Zen Kaku Gothic New, sans-serif',
            fontWeight: 300
          }}>
            {t.subtitle}
          </p>
        </div>

        {/* Goal and Level Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-12 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          <div className="p-6 rounded-xl border transition-all duration-300" style={{
            background: 'rgba(240, 122, 106, 0.04)',
            borderColor: 'rgba(240, 122, 106, 0.18)'
          }}>
            <label className="block text-xs font-mono uppercase tracking-wider mb-4" style={{
              color: 'rgba(240, 122, 106, 0.7)',
              fontFamily: 'Space Mono, monospace',
              letterSpacing: '0.25em'
            }}>
              {t.goal}
            </label>
            <select 
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-lg" style={{
                color: 'rgba(245, 240, 250, 0.92)',
                fontFamily: 'Zen Kaku Gothic New, sans-serif'
              }}
            >
              <option value="strength" style={{ backgroundColor: '#0b0b0f' }}>{t.strength}</option>
              <option value="cardio" style={{ backgroundColor: '#0b0b0f' }}>{t.cardio}</option>
              <option value="flexibility" style={{ backgroundColor: '#0b0b0f' }}>{t.flexibility}</option>
              <option value="weight_loss" style={{ backgroundColor: '#0b0b0f' }}>{t.weight_loss}</option>
            </select>
          </div>

          <div className="p-6 rounded-xl border transition-all duration-300" style={{
            background: 'rgba(170, 220, 120, 0.04)',
            borderColor: 'rgba(170, 220, 120, 0.18)'
          }}>
            <label className="block text-xs font-mono uppercase tracking-wider mb-4" style={{
              color: 'rgba(170, 220, 120, 0.7)',
              fontFamily: 'Space Mono, monospace',
              letterSpacing: '0.25em'
            }}>
              {t.level}
            </label>
            <select 
              value={fitnessLevel}
              onChange={(e) => setFitnessLevel(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-lg" style={{
                color: 'rgba(245, 240, 250, 0.92)',
                fontFamily: 'Zen Kaku Gothic New, sans-serif'
              }}
            >
              <option value="beginner" style={{ backgroundColor: '#0b0b0f' }}>{t.beginner}</option>
              <option value="intermediate" style={{ backgroundColor: '#0b0b0f' }}>{t.intermediate}</option>
              <option value="advanced" style={{ backgroundColor: '#0b0b0f' }}>{t.advanced}</option>
            </select>
          </div>
        </div>

        {/* Custom Plan Builder */}
        {hasPro && (
          <div className="mb-8 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className="p-6 rounded-xl border relative overflow-hidden" style={{
              background: 'rgba(240, 122, 106, 0.06)',
              borderColor: 'rgba(240, 122, 106, 0.25)'
            }}>
              <div className="absolute top-0 left-0 w-0.5 h-full" style={{
                background: 'linear-gradient(to bottom, rgba(240, 122, 106, 0.8), rgba(170, 220, 120, 0.8))'
              }}></div>
              <div className="ml-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl" style={{
                    color: 'rgba(245, 240, 250, 0.92)',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontWeight: 300
                  }}>
                    {t.customPlans}
                  </h3>
                  <span className="px-3 py-1 rounded-full border text-xs font-mono uppercase tracking-wider" style={{
                    background: 'rgba(240, 122, 106, 0.15)',
                    borderColor: 'rgba(240, 122, 106, 0.35)',
                    color: 'rgba(240, 122, 106, 0.9)',
                    fontFamily: 'Space Mono, monospace'
                  }}>
                    PRO FEATURE
                  </span>
                </div>
                <p className="mb-4" style={{
                  color: 'rgba(245, 240, 250, 0.45)',
                  fontSize: '15px'
                }}>
                  Create personalized workout plans tailored to your specific goals and equipment.
                </p>
                <button 
                  onClick={handleCreateCustom}
                  className="px-6 py-3 rounded-full border transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-98"
                  style={{
                    background: 'rgba(240, 122, 106, 0.1)',
                    borderColor: 'rgba(240, 122, 106, 0.35)',
                    color: 'rgba(245, 240, 250, 0.92)',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase'
                  }}
                >
                  {t.createCustom}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workout Plans Grid */}
        <div className="mb-8">
          <h2 className="text-2xl mb-6 animate-fadeInUp" style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 300,
            color: 'rgba(245, 240, 250, 0.92)',
            animationDelay: '0.45s'
          }}>
            {t.basicPlans}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div 
                key={plan.id}
                className="group p-6 rounded-xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fadeInUp relative overflow-hidden"
                style={{
                  background: selectedPlan?.id === plan.id ? 'rgba(240, 122, 106, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: selectedPlan?.id === plan.id ? 'rgba(240, 122, 106, 0.45)' : 'rgba(240, 122, 106, 0.18)',
                  animationDelay: `${0.6 + index * 0.15}s`
                }}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="absolute top-0 left-0 w-0.5 h-full opacity-40" style={{
                  background: 'linear-gradient(to bottom, rgba(240, 122, 106, 0.8), rgba(170, 220, 120, 0.8))'
                }}></div>
                
                <div className="ml-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold" style={{
                      color: 'rgba(245, 240, 250, 0.92)',
                      fontFamily: 'Zen Kaku Gothic New, sans-serif'
                    }}>
                      {plan.name}
                    </h3>
                    {plan.premium && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-mono" style={{
                        background: 'rgba(170, 220, 120, 0.1)',
                        borderColor: 'rgba(170, 220, 120, 0.35)',
                        color: 'rgba(170, 220, 120, 0.9)',
                        fontFamily: 'Space Mono, monospace'
                      }}>
                        <Lock size={10} />
                        {t.premiumOnly}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm mb-4" style={{
                    color: 'rgba(245, 240, 250, 0.45)',
                    lineHeight: 1.5
                  }}>
                    {plan.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-xs" style={{
                    fontFamily: 'Space Mono, monospace',
                    color: 'rgba(245, 240, 250, 0.7)'
                  }}>
                    <div className="flex items-center gap-2">
                      <Target size={12} style={{ color: 'rgba(240, 122, 106, 0.7)' }} />
                      {plan.exercises} {t.exercises}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={12} style={{ color: 'rgba(170, 220, 120, 0.7)' }} />
                      {plan.duration} {t.minutes}
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap size={12} style={{ color: 'rgba(240, 122, 106, 0.7)' }} />
                      {t.difficulty}: {plan.difficulty}/5
                    </div>
                    <div className="flex items-center gap-2">
                      <Star size={12} style={{ color: 'rgba(170, 220, 120, 0.7)' }} />
                      {plan.equipment}
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartWorkout(plan);
                    }}
                    disabled={plan.premium && !hasPro}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full border transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: plan.premium && !hasPro ? 'rgba(170, 220, 120, 0.1)' : 'rgba(240, 122, 106, 0.1)',
                      borderColor: plan.premium && !hasPro ? 'rgba(170, 220, 120, 0.35)' : 'rgba(240, 122, 106, 0.35)',
                      color: 'rgba(245, 240, 250, 0.92)',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '11px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {plan.premium && !hasPro ? (
                      <>
                        <Lock size={14} />
                        {t.unlock}
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        {t.startWorkout}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full p-6 rounded-xl border" style={{
            background: '#0b0b0f',
            borderColor: 'rgba(240, 122, 106, 0.25)'
          }}>
            <h3 className="text-xl mb-4" style={{
              color: 'rgba(245, 240, 250, 0.92)',
              fontFamily: 'Cormorant Garamond, serif'
            }}>
              Share Your Feedback
            </h3>
            <textarea 
              placeholder="How can we improve your workout experience?"
              className="w-full p-3 rounded-lg border bg-transparent resize-none mb-4"
              rows={4}
              style={{
                borderColor: 'rgba(240, 122, 106, 0.18)',
                color: 'rgba(245, 240, 250, 0.92)'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  submitFeedback(e.target.value);
                }
              }}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowFeedback(false)}
                className="flex-1 px-4 py-2 rounded-full border transition-all duration-200"
                style={{
                  borderColor: 'rgba(245, 240, 250, 0.2)',
                  color: 'rgba(245, 240, 250, 0.45)'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={(e) => {
                  const feedback = e.target.parentElement.previousElementSibling.value;
                  if (feedback.trim()) submitFeedback(feedback);
                }}
                className="flex-1 px-4 py-2 rounded-full border transition-all duration-200"
                style={{
                  background: 'rgba(240, 122, 106, 0.1)',
                  borderColor: 'rgba(240, 122, 106, 0.35)',
                  color: 'rgba(245, 240, 250, 0.92)'
                }}
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlan;