import React, { useState, useEffect } from 'react';
import { checkEntitlements, getOfferings, purchasePackage } from '../lib/revenuecat';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, Check, Star, Zap, Crown, Users, Target, TrendingUp } from 'lucide-react';

const SubscriptionModal = ({ user, isOpen, onClose, onSubscribed }) => {
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasPro, setHasPro] = useState(false);

  const translations = {
    en: {
      title: 'Unlock Your Potential',
      subtitle: '力を解放せよ。無限の成長を。',
      free: 'Free',
      pro: 'Pro',
      premium: 'Premium',
      monthly: '/month',
      currentPlan: 'CURRENT PLAN',
      popular: 'MOST POPULAR',
      recommended: 'RECOMMENDED',
      upgrade: 'Upgrade Now',
      features: 'Features',
      close: 'Close',
      processing: 'Processing...',
      error: 'Purchase failed. Please try again.',
      success: 'Welcome to WorkoutWise Pro!',
      feedback: 'Feedback',
      freeFeatures: [
        'Basic workouts & form analysis',
        '5 sessions per week',
        'Exercise library access',
        'Basic progress tracking'
      ],
      proFeatures: [
        'Everything in Free',
        'Unlimited workout sessions',
        'Advanced AI coaching',
        'Personalized nutrition plans',
        'Custom workout creation',
        'Detailed biomechanical analysis',
        'Progress analytics & insights'
      ],
      premiumFeatures: [
        'Everything in Pro',
        '1-on-1 virtual coaching sessions',
        'Personalized meal planning',
        'Advanced form correction',
        'Priority customer support',
        'Exclusive workout programs',
        'Real-time coaching feedback'
      ]
    },
    ja: {
      title: 'あなたの可能性を解放',
      subtitle: 'Unlock your strength. Embrace infinite growth.',
      free: '無料',
      pro: 'プロ',
      premium: 'プレミアム',
      monthly: '/月',
      currentPlan: '現在のプラン',
      popular: '最も人気',
      recommended: 'おすすめ',
      upgrade: 'アップグレード',
      features: '機能',
      close: '閉じる',
      processing: '処理中...',
      error: '購入に失敗しました。もう一度お試しください。',
      success: 'WorkoutWise Proへようこそ！',
      feedback: 'フィードバック',
      freeFeatures: [
        '基本ワークアウトとフォーム分析',
        '週5セッション',
        'エクササイズライブラリアクセス',
        '基本的な進捗追跡'
      ],
      proFeatures: [
        '無料版のすべて',
        '無制限ワークアウトセッション',
        '高度なAIコーチング',
        'パーソナライズド栄養プラン',
        'カスタムワークアウト作成',
        '詳細な生体力学分析',
        '進捗分析と洞察'
      ],
      premiumFeatures: [
        'プロ版のすべて',
        '1対1バーチャルコーチングセッション',
        'パーソナライズド食事プランニング',
        '高度なフォーム修正',
        '優先カスタマーサポート',
        '限定ワークアウトプログラム',
        'リアルタイムコーチングフィードバック'
      ]
    }
  };

  const t = translations[language];

  const plans = {
    free: {
      price: 0,
      features: t.freeFeatures,
      icon: Target,
      color: 'rgba(245, 240, 250, 0.4)',
      accent: 'rgba(245, 240, 250, 0.2)'
    },
    pro: {
      price: 9.99,
      features: t.proFeatures,
      icon: Zap,
      color: 'rgba(240, 122, 106, 0.8)',
      accent: 'rgba(240, 122, 106, 0.25)',
      popular: true
    },
    premium: {
      price: 19.99,
      features: t.premiumFeatures,
      icon: Crown,
      color: 'rgba(170, 220, 120, 0.8)',
      accent: 'rgba(170, 220, 120, 0.25)',
      recommended: true
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOfferings();
      checkCurrentSubscription();
    }
  }, [isOpen]);

  const checkCurrentSubscription = async () => {
    try {
      const pro = await checkEntitlements();
      setHasPro(pro);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadOfferings = async () => {
    try {
      const offerings = await getOfferings();
      setOfferings(offerings);
    } catch (error) {
      console.error('Error loading offerings:', error);
    }
  };

  const handlePurchase = async (planType) => {
    if (planType === 'free' || loading) return;
    
    setLoading(true);
    try {
      if (offerings && offerings.availablePackages.length > 0) {
        const packageToPurchase = offerings.availablePackages.find(pkg => 
          pkg.identifier.includes(planType)
        ) || offerings.availablePackages[0];
        
        const success = await purchasePackage(packageToPurchase);
        
        if (success) {
          onSubscribed();
          setTimeout(onClose, 1500);
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (feedback) => {
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user?.uid,
        component: 'SubscriptionModal',
        feedback,
        timestamp: new Date(),
        type: 'feedback'
      });
      setShowFeedback(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-xl border" style={{
        background: '#0b0b0f',
        borderColor: 'rgba(240, 122, 106, 0.25)'
      }}>
        {/* Background Glow Effects */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-16 w-80 h-80 opacity-20 pointer-events-none">
          <div className="w-full h-full rounded-full" style={{
            background: 'radial-gradient(ellipse, rgba(240, 122, 106, 0.3) 0%, transparent 70%)'
          }}></div>
        </div>
        <div className="absolute bottom-0 right-1/4 transform translate-y-16 w-60 h-60 opacity-15 pointer-events-none">
          <div className="w-full h-full rounded-full" style={{
            background: 'radial-gradient(ellipse, rgba(170, 220, 120, 0.25) 0%, transparent 70%)'
          }}></div>
        </div>

        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-4xl" style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontWeight: 300,
                color: 'rgba(245, 240, 250, 0.92)',
                letterSpacing: '-0.02em'
              }}>
                {t.title}
              </h2>
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
            </div>
            
            <div className="flex items-center gap-3">
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
              <button 
                onClick={onClose}
                className="p-2 rounded-full transition-all duration-200 hover:scale-105" 
                style={{
                  color: 'rgba(245, 240, 250, 0.45)',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <p className="text-lg mb-12 text-center" style={{
            color: 'rgba(245, 240, 250, 0.45)',
            fontFamily: 'Zen Kaku Gothic New, sans-serif',
            fontWeight: 300
          }}>
            {t.subtitle}
          </p>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Object.entries(plans).map(([planType, plan], index) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === planType;
              const isCurrent = planType === 'free' || (hasPro && planType === 'pro');
              
              return (
                <div 
                  key={planType}
                  className={`relative p-6 rounded-xl border transition-all duration-300 cursor-pointer transform hover:-translate-y-1 animate-fadeInUp ${
                    isSelected ? 'scale-105' : ''
                  }`}
                  style={{
                    background: isSelected ? `rgba(240, 122, 106, 0.08)` : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isSelected ? plan.accent : 'rgba(245, 240, 250, 0.1)',
                    animationDelay: `${index * 0.15}s`
                  }}
                  onClick={() => setSelectedPlan(planType)}
                >
                  {/* Plan Badge */}
                  {(plan.popular || plan.recommended || isCurrent) && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full border text-xs font-mono uppercase tracking-wider" style={{
                        background: isCurrent ? 'rgba(170, 220, 120, 0.15)' : plan.popular ? 'rgba(240, 122, 106, 0.15)' : 'rgba(170, 220, 120, 0.15)',
                        borderColor: isCurrent ? 'rgba(170, 220, 120, 0.5)' : plan.popular ? 'rgba(240, 122, 106, 0.5)' : 'rgba(170, 220, 120, 0.5)',
                        color: isCurrent ? 'rgba(170, 220, 120, 0.9)' : plan.popular ? 'rgba(240, 122, 106, 0.9)' : 'rgba(170, 220, 120, 0.9)',
                        fontFamily: 'Space Mono, monospace'
                      }}>
                        {isCurrent ? t.currentPlan : plan.popular ? t.popular : t.recommended}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                      background: `rgba(240, 122, 106, 0.1)`,
                      color: plan.color
                    }}>
                      <Icon size={24} />
                    </div>
                    
                    <h3 className="text-2xl mb-2" style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontWeight: 300,
                      color: 'rgba(245, 240, 250, 0.92)'
                    }}>
                      {t[planType]}
                    </h3>
                    
                    <div className="text-3xl font-bold mb-1" style={{
                      color: plan.color,
                      fontFamily: 'Space Mono, monospace'
                    }}>
                      ${plan.price}
                      <span className="text-sm" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                        {planType !== 'free' && t.monthly}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check 
                          size={16} 
                          className="mt-0.5 flex-shrink-0" 
                          style={{ color: plan.color }}
                        />
                        <span className="text-sm" style={{
                          color: 'rgba(245, 240, 250, 0.7)',
                          lineHeight: 1.5
                        }}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(planType);
                    }}
                    disabled={loading || isCurrent || planType === 'free'}
                    className="w-full py-3 rounded-full border font-mono text-xs uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      background: isCurrent ? 'rgba(170, 220, 120, 0.1)' : `rgba(240, 122, 106, 0.1)`,
                      borderColor: isCurrent ? 'rgba(170, 220, 120, 0.35)' : plan.accent,
                      color: 'rgba(245, 240, 250, 0.92)',
                      fontFamily: 'Space Mono, monospace',
                      letterSpacing: '0.15em'
                    }}
                  >
                    {loading ? t.processing : 
                     isCurrent ? t.currentPlan :
                     planType === 'free' ? t.free : t.upgrade}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Features Comparison */}
          <div className="border-t pt-8" style={{ borderColor: 'rgba(245, 240, 250, 0.1)' }}>
            <h3 className="text-xl mb-6 text-center" style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontWeight: 300,
              color: 'rgba(245, 240, 250, 0.92)'
            }}>
              {t.features}
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} style={{ color: 'rgba(245, 240, 250, 0.4)' }} />
                  <span style={{ color: 'rgba(245, 240, 250, 0.7)' }}>Basic Training</span>
                </div>
                <ul className="space-y-2" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                  <li>• Form analysis basics</li>
                  <li>• Limited workout library</li>
                  <li>• Weekly progress reports</li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} style={{ color: 'rgba(240, 122, 106, 0.8)' }} />
                  <span style={{ color: 'rgba(240, 122, 106, 0.8)' }}>Pro Training</span>
                </div>
                <ul className="space-y-2" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                  <li>• Advanced form correction</li>
                  <li>• Unlimited workout access</li>
                  <li>• AI-powered coaching</li>
                  <li>• Custom nutrition plans</li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={16} style={{ color: 'rgba(170, 220, 120, 0.8)' }} />
                  <span style={{ color: 'rgba(170, 220, 120, 0.8)' }}>Premium Coaching</span>
                </div>
                <ul className="space-y-2" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                  <li>• 1-on-1 virtual sessions</li>
                  <li>• Real-time feedback</li>
                  <li>• Priority support</li>
                  <li>• Exclusive programs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 rounded-xl border" style={{
              background: '#0b0b0f',
              borderColor: 'rgba(240, 122, 106, 0.25)'
            }}>
              <h3 className="text-xl mb-4" style={{
                color: 'rgba(245, 240, 250, 0.92)',
                fontFamily: 'Cormorant Garamond, serif'
              }}>
                Share Your Thoughts
              </h3>
              <textarea 
                placeholder="How can we improve our pricing or features?"
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
    </div>
  );
};

export default SubscriptionModal;