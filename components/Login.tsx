
import React, { useState } from 'react';
import { auth } from '../services/firebaseService';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 chat-gradient animate-in fade-in duration-700">
      <div className="w-full max-w-sm glass p-8 rounded-3xl shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">실시간 톡</h1>
        <p className="text-gray-500 text-sm mb-8">{isSignUp ? '새로운 계정을 만드세요' : '임의로 등록한 이메일로 로그인하세요'}</p>
        
        {error && <p className="text-red-500 text-xs mb-4 text-center bg-red-50 p-2 rounded-lg w-full">{error}</p>}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {isSignUp && (
             <input 
                type="text" 
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                required
             />
          )}
          <input 
            type="email" 
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            required
          />
          <input 
            type="password" 
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '처리 중...' : (isSignUp ? '회원가입' : '로그인')}
          </button>
        </form>
        
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-6 text-sm text-indigo-600 font-medium hover:underline"
        >
          {isSignUp ? '이미 계정이 있나요? 로그인' : '처음이신가요? 회원가입'}
        </button>
      </div>
    </div>
  );
};

export default Login;
