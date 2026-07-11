import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { AlertTriangle, Loader, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginScreen: React.FC = () => {
  const { login, signup, loading, error: authError } = useAuth();
  const [email, setEmail] = useState('demo@yadira.app');
  const [password, setPassword] = useState('demo123456');
  const [isSignup, setIsSignup] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Email and password required');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C8D71] to-[#3A5D45] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-[#E3DFC2]"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#E8F1EB] rounded-full">
              <Heart className="w-8 h-8 text-[#5C8D71]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#2C2C2A] mb-2">Yadira</h1>
          <p className="text-[#7E7D76] text-sm">Dementia Companion Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#2C2C2A] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-[#C4C09E] rounded-lg focus:outline-none focus:ring-3 focus:ring-[#5C8D71] bg-[#FCFAF5] text-lg"
              placeholder="your@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-[#2C2C2A] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-[#C4C09E] rounded-lg focus:outline-none focus:ring-3 focus:ring-[#5C8D71] bg-[#FCFAF5] text-lg"
              placeholder="••••••••"
            />
            {!isSignup && (
              <p className="text-xs text-[#7E7D76] mt-1">
                Demo: <code className="bg-gray-100 px-2 py-0.5 rounded">demo123456</code>
              </p>
            )}
          </div>

          {/* Error */}
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">{displayError}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#3A5D45] text-white font-bold rounded-lg hover:bg-[#2B4633] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-5 h-5 animate-spin" />}
            {loading ? 'Loading...' : isSignup ? 'Create Account' : 'Log In'}
          </button>
        </form>

        {/* Toggle Signup/Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-[#7E7D76]">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              disabled={loading}
              className="text-[#5C8D71] font-semibold hover:underline disabled:opacity-50"
            >
              {isSignup ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Demo Note */}
        {!isSignup && (
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">Demo:</span> Email pre-filled with <code className="bg-white px-1 rounded">demo@yadira.app</code>. Change email to test signup.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
