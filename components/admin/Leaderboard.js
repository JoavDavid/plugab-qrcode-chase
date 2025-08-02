import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export default function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [solveLog, setSolveLog] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const solvesQuery = query(collection(firestore, 'solves'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(solvesQuery, (snapshot) => {
            const solves = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate() }));
            setSolveLog(solves);

            const playerStats = {};
            solves.forEach(solve => {
                if (!playerStats[solve.playerName]) {
                    playerStats[solve.playerName] = { name: solve.playerName, solves: new Set(), lastSolve: new Date(0) };
                }
                playerStats[solve.playerName].solves.add(solve.puzzleId);
                if (solve.timestamp > playerStats[solve.playerName].lastSolve) {
                    playerStats[solve.playerName].lastSolve = solve.timestamp;
                }
            });

            const rankedPlayers = Object.values(playerStats).map(player => ({ name: player.name, score: player.solves.size, lastSolve: player.lastSolve }));
            rankedPlayers.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.lastSolve - b.lastSolve;
            });

            setLeaderboardData(rankedPlayers);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold text-white mb-4">Leaderboard</h3>
                <div className="bg-slate-900/70 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                    {isLoading ? <p className="p-4 text-center text-gray-300">Loading...</p> : (
                        <ol>
                            {leaderboardData.map((player, index) => (
                                <li key={player.name} className={`flex items-center justify-between p-4 border-b border-white/10 ${index === 0 ? 'bg-yellow-400/20' : ''} ${index === 1 ? 'bg-slate-500/20' : ''} ${index === 2 ? 'bg-orange-700/20' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-bold text-cyan-400 w-8 text-center">{index + 1}</span>
                                        <span className="font-semibold text-white">{player.name}</span>
                                    </div>
                                    <span className="font-bold text-xl text-white">{player.score}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                    {leaderboardData.length === 0 && !isLoading && <p className="p-4 text-center text-gray-400">No solves yet.</p>}
                </div>
            </div>

            <div className="lg:col-span-3">
                <h3 className="text-2xl font-bold text-white mb-4">Solve Log</h3>
                <div className="bg-slate-900/70 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-200 uppercase bg-white/10">
                            <tr>
                                <th scope="col" className="px-6 py-3">Player</th>
                                <th scope="col" className="px-6 py-3">Puzzle #</th>
                                <th scope="col" className="px-6 py-3">Time</th>
                            </tr>
                            </thead>
                            <tbody>
                            {isLoading ? (
                                <tr><td colSpan="3" className="text-center p-4 text-gray-300">Loading...</td></tr>
                            ) : (
                                solveLog.map(solve => (
                                    <tr key={solve.id} className="border-b border-white/10 hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{solve.playerName}</td>
                                        <td className="px-6 py-4">{solve.puzzleNumber}</td>
                                        <td className="px-6 py-4">{solve.timestamp ? solve.timestamp.toLocaleString() : '...'}</td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                    {solveLog.length === 0 && !isLoading && <p className="p-4 text-center text-gray-400">No solves recorded.</p>}
                </div>
            </div>
        </div>
    );
}