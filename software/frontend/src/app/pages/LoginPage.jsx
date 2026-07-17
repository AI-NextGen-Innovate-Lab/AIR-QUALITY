import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Cloud, Mail, Lock, User } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { cn } from '@/app/lib/utils/cn';
import { inputClass } from '@/app/lib/dashboardStyles';

function Field({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      {children}
    </div>
  );
}

export default function LoginPage() {
  const { login, register, error: authError } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const isLongEnough = password.length >= 8;
    return {
      isValid:
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar &&
        isLongEnough,
      errors: [
        !isLongEnough && 'At least 8 characters',
        !hasUpperCase && 'One uppercase letter',
        !hasLowerCase && 'One lowercase letter',
        !hasNumber && 'One number',
        !hasSpecialChar && 'One special character (@$!%*?&)',
      ].filter(Boolean),
    };
  };

  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: [],
  });

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setRegisterPassword(pwd);
    setPasswordValidation(validatePassword(pwd));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);
    try {
      const success = await login(loginEmail, loginPassword);
      if (success) navigate('/dashboard');
      else setLocalError(authError || 'Invalid email or password');
    } catch {
      setLocalError('Login error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (registerPassword !== registerConfirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    const pv = validatePassword(registerPassword);
    if (!pv.isValid) {
      setLocalError('Password: ' + pv.errors.join(', '));
      return;
    }
    setIsLoading(true);
    try {
      const success = await register(registerName, registerEmail, registerPassword);
      if (success) navigate('/dashboard');
      else setLocalError(authError || 'Registration failed');
    } catch {
      setLocalError('Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="relative py-12 sm:py-16 flex items-center justify-center min-h-[70vh]">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md border-border shadow-[var(--shadow-card-hover)]">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-brand-100 mx-auto mb-3">
              <Cloud className="text-brand-700" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">AirQuality DSM</h1>
            <p className="text-muted text-sm mt-1">Sign in to access dashboards and downloads</p>
          </div>

          <div className="flex bg-surface rounded-xl p-1 mb-5 border border-border">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setLocalError('');
                }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-surface-elevated text-brand-700 shadow-sm'
                    : 'text-muted'
                )}
              >
                {tab === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          {displayError && (
            <div className="mb-4 rounded-xl border border-aqi-unhealthy/30 bg-aqi-unhealthy-soft/40 p-3 text-sm text-aqi-unhealthy">
              {displayError}
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field icon={Mail}>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full py-2.5 outline-none bg-transparent"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </Field>
              <Field icon={Lock}>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full py-2.5 outline-none bg-transparent"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </Field>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field icon={User}>
                <input
                  type="text"
                  placeholder="Full name"
                  className="w-full py-2.5 outline-none bg-transparent"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />
              </Field>
              <Field icon={Mail}>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full py-2.5 outline-none bg-transparent"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </Field>
              <Field icon={Lock}>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full py-2.5 outline-none bg-transparent"
                  value={registerPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Field>
              {registerPassword && (
                <div className="text-xs text-muted bg-surface rounded-xl p-3 border border-border">
                  <p className="font-semibold text-foreground mb-2">Password requirements</p>
                  <ul className="space-y-1">
                    {[
                      ['8 characters', !passwordValidation.errors.some((e) => e.includes('8'))],
                      ['uppercase', !passwordValidation.errors.some((e) => e.includes('uppercase'))],
                      ['lowercase', !passwordValidation.errors.some((e) => e.includes('lowercase'))],
                      ['number', !passwordValidation.errors.some((e) => e.includes('number'))],
                      ['special', !passwordValidation.errors.some((e) => e.includes('special'))],
                    ].map(([label, ok]) => (
                      <li key={label} className={ok ? 'text-aqi-good' : 'text-aqi-unhealthy'}>
                        {ok ? '✓' : '✗'} {label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Field icon={Lock}>
                <input
                  type="password"
                  placeholder="Confirm password"
                  className="w-full py-2.5 outline-none bg-transparent"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                />
              </Field>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !passwordValidation.isValid}
              >
                {isLoading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/" className="text-brand-700 hover:text-brand-800 font-medium">
              ← Back to public air quality data
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
