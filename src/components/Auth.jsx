import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { initializeRevenueCat } from '../lib/revenuecat';

const Auth = ({ onAuthStateChange }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('en');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const text = {
    en: {
      welcome: 'WorkoutWise Pro',
      subtitle: 'AI-Powered Personal Training',
      tagline: 'Perfect form. Smarter training.',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      continueAnon: 'Continue as Guest',
      switchToSignUp: 'Need an account? Sign up',
      switchToSignIn: 'Have an account? Sign in',
      forgotPassword: 'Forgot password?',
      resetPassword: 'Reset Password',
      resetSent: 'Password reset email sent!',
      signOut: 'Sign Out',
      loading: 'Loading...',
      sending: 'Sending...',
      cancel: 'Cancel',
      close: 'Close'
    },
    ja: {
      welcome: 'WorkoutWise Pro',
      subtitle: 'AI パーソナルトレーニング',
      tagline: '完璧なフォーム。賢いトレーニング。',
      signIn: 'ログイン',
      signUp: '新規登録',
      email: 'メールアドレス',
      password: 'パスワード',
      continueAnon: 'ゲストで続行',
      switchToSignUp: 'アカウントをお持ちでない方',
      switchToSignIn: 'アカウントをお持ちの方',
      forgotPassword: 'パスワードを忘れた方',
      resetPassword: 'パスワードリセット',
      resetSent: 'リセットメールを送信しました！',
      signOut: 'ログアウト',
      loading: '読み込み中...',
      sending: '送信中...',
      cancel: 'キャンセル',
      close: '閉じる'
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Initialize RevenueCat with user ID
        try {
          await initializeRevenueCat(firebaseUser.uid);
        } catch (error) {
          console.error('Failed to initialize RevenueCat:', error);
        }

        // Create or update user document
        const userDoc = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userDoc);
        
        if (!userSnap.exists()) {
          await setDoc(userDoc, {
            email: firebaseUser.email,
            isAnonymous: firebaseUser.isAnonymous,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          });
        } else {
          await setDoc(userDoc, {
            lastLoginAt: new Date().toISOString()
          }, { merge: true });
        }
        
        setUser(firebaseUser);
        onAuthStateChange?.(firebaseUser);
      } else {
        setUser(null);
        onAuthStateChange?.(null);
      }
    });

    return () => unsubscribe();
  }, [onAuthStateChange]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleAnonymousAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      await signInAnonymously(auth);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (user) {
    return (
      <div className="auth-container">
        <div className="glow-bg"></div>
        
        <div className="auth-card user-card">
          <div className="user-info">
            <div className="user-avatar">
              {user.email ? user.email[0].toUpperCase() : 'G'}
            </div>
            <div>
              <div className="user-email">{user.email || text[language].continueAnon}</div>
              <div className="user-meta">
                {user.isAnonymous ? 'GUEST USER' : 'REGISTERED USER'}
              </div>
            </div>
          </div>
          
          <div className="auth-actions">
            <button className="lang-toggle" onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}>
              {language === 'en' ? '日本語' : 'English'}
            </button>
            <button className="sign-out-btn" onClick={handleSignOut}>
              {text[language].signOut}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="glow-bg"></div>
      <div className="glow-accent"></div>
      
      <div className="auth-content">
        <div className="auth-header">
          <div className="auth-eyebrow">TRANSFORM YOUR FITNESS</div>
          <h1 className="auth-title">{text[language].welcome}</h1>
          <p className="auth-subtitle">{text[language].subtitle}</p>
          <p className="auth-tagline">{text[language].tagline}</p>
        </div>

        <div className="auth-card">
          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth}>
            <div className="form-group">
              <label>{text[language].email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>{text[language].password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <button type="submit" className="auth-btn primary" disabled={loading}>
              {loading ? text[language].loading : (isLogin ? text[language].signIn : text[language].signUp)}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button className="auth-btn secondary" onClick={handleAnonymousAuth} disabled={loading}>
            {text[language].continueAnon}
          </button>

          <div className="auth-links">
            <button 
              className="link-btn" 
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? text[language].switchToSignUp : text[language].switchToSignIn}
            </button>
            
            {isLogin && (
              <button 
                className="link-btn" 
                onClick={() => setShowResetModal(true)}
                disabled={loading}
              >
                {text[language].forgotPassword}
              </button>
            )}
          </div>
        </div>

        <div className="auth-footer">
          <button className="lang-toggle" onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}>
            {language === 'en' ? '日本語' : 'English'}
          </button>
          
          <div className="auth-meta">WorkoutWise Pro © 2024</div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            {resetSent ? (
              <div className="modal-content">
                <h3>{text[language].resetSent}</h3>
                <p>Please check your email for reset instructions.</p>
                <button 
                  className="auth-btn primary" 
                  onClick={() => {
                    setShowResetModal(false);
                    setResetSent(false);
                    setResetEmail('');
                  }}
                >
                  {text[language].close}
                </button>
              </div>
            ) : (
              <div className="modal-content">
                <h3>{text[language].resetPassword}</h3>
                <form onSubmit={handlePasswordReset}>
                  <div className="form-group">
                    <label>{text[language].email}</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="auth-btn secondary"
                      onClick={() => setShowResetModal(false)}
                      disabled={loading}
                    >
                      {text[language].cancel}
                    </button>
                    <button type="submit" className="auth-btn primary" disabled={loading}>
                      {loading ? text[language].sending : text[language].resetPassword}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .auth-container {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #0b0b0f;
          overflow: hidden;
        }

        .glow-bg {
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(240, 122, 106, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .glow-accent {
          position: absolute;
          bottom: -150px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(170, 220, 120, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .auth-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 480px;
          animation: fadeInUp 0.6s ease both;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.25em;
          color: rgba(240, 122, 106, 0.7);
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .auth-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          font-weight: 300;
          color: rgba(245, 240, 250, 0.92);
          margin-bottom: 8px;
          font-style: italic;
        }

        .auth-subtitle {
          font-size: 18px;
          color: rgba(245, 240, 250, 0.45);
          margin-bottom: 4px;
        }

        .auth-tagline {
          font-size: 14px;
          color: rgba(170, 220, 120, 0.6);
          font-style: italic;
        }

        .auth-card, .user-card {
          background: rgba(240, 122, 106, 0.04);
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 16px;
          padding: 32px;
          transition: border-color 0.3s, background 0.3s;
          animation: fadeInUp 0.6s ease 0.15s both;
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(240, 122, 106, 0.1);
          border: 0.5px solid rgba(240, 122, 106, 0.3);
          border-radius: 8px;
          color: rgba(240, 122, 106, 0.8);
          font-size: 14px;
          margin-bottom: 24px;
        }

        .error-icon {
          font-size: 16px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: rgba(245, 240, 250, 0.45);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .form-group input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(245, 240, 250, 0.02);
          border: 0.5px solid rgba(240, 122, 106, 0.15);
          border-radius: 8px;
          color: rgba(245, 240, 250, 0.92);
          font-size: 16px;
          transition: border-color 0.2s, background 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: rgba(240, 122, 106, 0.45);
          background: rgba(240, 122, 106, 0.06);
        }

        .auth-btn {
          width: 100%;
          padding: 14px 28px;
          border-radius: 40px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
        }

        .auth-btn.primary {
          background: rgba(240, 122, 106, 0.15);
          border: 0.5px solid rgba(240, 122, 106, 0.35);
          color: rgba(240, 122, 106, 0.9);
        }

        .auth-btn.primary:hover:not(:disabled) {
          background: rgba(240, 122, 106, 0.25);
          border-color: rgba(240, 122, 106, 0.6);
          transform: translateY(-1px);
        }

        .auth-btn.secondary {
          background: rgba(170, 220, 120, 0.1);
          border: 0.5px solid rgba(170, 220, 120, 0.25);
          color: rgba(170, 220, 120, 0.8);
        }

        .auth-btn.secondary:hover:not(:disabled) {
          background: rgba(170, 220, 120, 0.18);
          border-color: rgba(170, 220, 120, 0.5);
          transform: translateY(-1px);
        }

        .auth-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .auth-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auth-divider {
          position: relative;
          text-align: center;
          margin: 24px 0;
        }

        .auth-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 0.5px;
          background: linear-gradient(to right, transparent, rgba(245, 240, 250, 0.1), transparent);
        }

        .auth-divider span {
          background: #0b0b0f;
          padding: 0 16px;
          color: rgba(245, 240, 250, 0.2);
          font-size: 12px;
        }

        .auth-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 24px;
        }

        .link-btn {
          background: none;
          border: none;
          color: rgba(240, 122, 106, 0.6);
          font-size: 13px;
          cursor: pointer;
          transition: color 0.2s;
          text-align: center;
        }

        .link-btn:hover:not(:disabled) {
          color: rgba(240, 122, 106, 0.8);
        }

        .auth-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 32px;
          animation: fadeInUp 0.6s ease 0.3s both;
        }

        .lang-toggle {
          background: rgba(245, 240, 250, 0.03);
          border: 0.5px solid rgba(245, 240, 250, 0.1);
          border-radius: 20px;
          padding: 6px 14px;
          color: rgba(245, 240, 250, 0.45);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .lang-toggle:hover {
          background: rgba(245, 240, 250, 0.06);
          border-color: rgba(245, 240, 250, 0.2);
        }

        .auth-meta {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(245, 240, 250, 0.2);
          letter-spacing: 0.1em;
        }

        .user-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(240, 122, 106, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(240, 122, 106, 0.9);
          font-weight: 600;
          font-size: 18px;
        }

        .user-email {
          color: rgba(245, 240, 250, 0.92);
          font-size: 16px;
          margin-bottom: 4px;
        }

        .user-meta {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: rgba(170, 220, 120, 0.6);
        }

        .auth-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .sign-out-btn {
          background: rgba(240, 122, 106, 0.1);
          border: 0.5px solid rgba(240, 122, 106, 0.25);
          border-radius: 20px;
          padding: 8px 16px;
          color: rgba(240, 122, 106, 0.8);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sign-out-btn:hover {
          background: rgba(240, 122, 106, 0.18);
          border-color: rgba(240, 122, 106, 0.5);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }

        .modal-card {
          background: rgba(240, 122, 106, 0.04);
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 400px;
          animation: fadeIn 0.3s ease;
        }

        .modal-content h3 {
          color: rgba(245, 240, 250, 0.92);
          margin-bottom: 16px;
          font-size: 20px;
          font-weight: 300;
        }

        .modal-content p {
          color: rgba(245, 240, 250, 0.45);
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .modal-actions .auth-btn {
          width: auto;
          min-width: 100px;
          margin-bottom: 0;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 640px) {
          .auth-title {
            font-size: 36px;
          }
          
          .auth-card, .user-card {
            padding: 24px;
          }
          
          .user-card {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Auth;