import { useState } from 'react';
import NextHead from 'next/head';
import ProtectedRoute from '../../components/ProtectedRoute';
import PuzzleManager from '../../components/admin/PuzzleManager';
import Leaderboard from '../../components/admin/Leaderboard';
import { useAuth as useFirebaseAuthHook } from '../../context/AuthContext';

function AdminDashboard() {
    const { user, logout } = useFirebaseAuthHook();
    const [activeTab, setActiveTab] = useState('puzzles');

    const TabButton = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors outline-none ${activeTab === tabName ? 'bg-slate-900/50 text-cyan-300 border-b-2 border-cyan-300' : 'text-gray-300 hover:bg-black/20'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="main-background min-h-screen text-white">
            <NextHead><title>Admin Dashboard - Plugab</title></NextHead>
            <header className="bg-black/30 backdrop-blur-lg sticky top-0 z-20 border-b border-white/10">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold">Plugab Admin</h1>
                    <div>
                        <span className="mr-4 text-gray-300 hidden sm:inline">{user?.email}</span>
                        <button onClick={logout} className="px-4 py-2 font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-600 shadow-lg">Logout</button>
                    </div>
                </nav>
            </header>
            <main className="container mx-auto px-6 py-8">
                <div className="border-b border-white/10 mb-6">
                    <div className="flex space-x-2">
                        <TabButton tabName="puzzles">Puzzle Management</TabButton>
                        <TabButton tabName="leaderboard">Leaderboard</TabButton>
                    </div>
                </div>

                <div>
                    {activeTab === 'puzzles' && <PuzzleManager />}
                    {activeTab === 'leaderboard' && <Leaderboard />}
                </div>
            </main>
        </div>
    );
}

export default function ProtectedAdminDashboard() {
    return (<ProtectedRoute><AdminDashboard /></ProtectedRoute>);
}