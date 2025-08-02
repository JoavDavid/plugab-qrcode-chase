import { useState } from 'react';
import { useRouter as useNextRouter } from 'next/router';
import NextHead from 'next/head';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as firebaseAuth } from '../../lib/firebase';
import { useAuth as useFirebaseAuth } from '../../context/AuthContext';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useNextRouter();
    const { user } = useFirebaseAuth();

    if (user) {
        router.push('/admin');
        return null;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(firebaseAuth, email, password);
            router.push('/admin');
        } catch (err) {
            setError('Failed to sign in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="main-background flex items-center justify-center min-h-screen">
            <NextHead><title>Admin Login - Plugab</title></NextHead>
            <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl text-white">
                <h1 className="text-3xl font-bold text-center">Admin Login</h1>
                <form onSubmit={handleLogin} className="space-y-6">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" required />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" required />
                    <button type="submit" disabled={isLoading} className="w-full py-3 font-bold text-white bg-cyan-500/70 border border-cyan-400/50 rounded-lg hover:bg-cyan-500/90 transition-colors shadow-lg hover:shadow-cyan-500/40 disabled:bg-gray-500/50">{isLoading ? 'Signing In...' : 'Sign In'}</button>
                    {error && <p className="text-sm text-center text-red-400">{error}</p>}
                </form>
            </div>
        </div>
    );
}