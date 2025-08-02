import { useState, useEffect } from 'react';
import Head from 'next/head';
import { doc, getDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { firestore as db } from '../../lib/firebase';
import { createPlayerFingerprint as createFingerprint } from '../../lib/utils';

export async function getServerSideProps(context) {
    const { puzzleId } = context.params;
    const puzzleRef = doc(db, 'puzzles', puzzleId);
    const puzzleSnap = await getDoc(puzzleRef);

    if (!puzzleSnap.exists()) return { notFound: true };

    const puzzleData = { id: puzzleSnap.id, ...puzzleSnap.data() };
    if (puzzleData.createdAt) {
        puzzleData.createdAt = puzzleData.createdAt.toDate().toISOString();
    }

    return { props: { puzzle: puzzleData } };
}

export default function SolvePage({ puzzle }) {
    const [step, setStep] = useState('verify');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [solveRank, setSolveRank] = useState(0);
    const [puzzleNumberInput, setPuzzleNumberInput] = useState('');
    const [playerNameInput, setPlayerNameInput] = useState('');
    const [retries, setRetries] = useState(3);

    useEffect(() => {
        if (puzzle.status !== 'active') setStep('inactive');
    }, [puzzle]);

    const handleVerifySubmit = (e) => {
        e.preventDefault();
        if (retries <= 0) return;
        if (parseInt(puzzleNumberInput, 10) === puzzle.puzzleNumber) {
            setError('');
            setStep('name');
        } else {
            setRetries(r => r - 1);
            setError(`Incorrect. ${retries - 1} attempts remaining.`);
            if (retries - 1 <= 0) {
                setError('Too many incorrect attempts.');
                setStep('locked');
            }
        }
    };

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        if (!playerNameInput.trim()) return setError('Please enter a name.');
        setIsLoading(true);
        setError('');

        try {
            const fingerprint = createFingerprint();
            const solveId = `${puzzle.id}_${fingerprint}`;

            await runTransaction(db, async (transaction) => {
                const solveRef = doc(db, 'solves', solveId);
                const puzzleRef = doc(db, 'puzzles', puzzle.id);

                const existingSolveSnap = await transaction.get(solveRef);
                if (existingSolveSnap.exists()) throw new Error("ALREADY_SOLVED");

                const puzzleSnap = await transaction.get(puzzleRef);
                const currentSolves = puzzleSnap.data().solveCount || 0;
                setSolveRank(currentSolves + 1);

                transaction.set(solveRef, {
                    puzzleId: puzzle.id,
                    puzzleNumber: puzzle.puzzleNumber,
                    playerName: playerNameInput.trim(),
                    playerFingerprint: fingerprint,
                    timestamp: serverTimestamp(),
                });

                transaction.update(puzzleRef, { solveCount: currentSolves + 1 });
            });

            setStep('success');
        } catch (err) {
            if (err.message === "ALREADY_SOLVED") {
                setStep('already_solved');
            } else {
                console.error("Error logging solve:", err);
                setError('Could not save your time.');
                setStep('error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        switch (step) {
            case 'verify':
                return (
                    <form onSubmit={handleVerifySubmit} className="w-full">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-100">You've found a puzzle!</h2>
                        <p className="mb-6 text-gray-300">Enter the puzzle number below to verify.</p>
                        <input type="number" value={puzzleNumberInput} onChange={(e) => setPuzzleNumberInput(e.target.value)} className="w-full px-4 py-3 mb-4 text-lg text-center bg-black/20 border border-white/20 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" placeholder="Puzzle #" autoFocus />
                        <button type="submit" className="w-full py-3 font-bold text-white bg-cyan-500/70 border border-cyan-400/50 rounded-lg hover:bg-cyan-500/90 transition-colors shadow-lg hover:shadow-cyan-500/40">Verify</button>
                    </form>
                );
            case 'name':
                return (
                    <form onSubmit={handleNameSubmit} className="w-full">
                        <h2 className="text-2xl font-bold mb-4 text-green-300">Success!</h2>
                        <p className="mb-6 text-gray-300">What is your name or nickname?</p>
                        <input type="text" value={playerNameInput} onChange={(e) => setPlayerNameInput(e.target.value)} className="w-full px-4 py-3 mb-4 text-lg text-center bg-black/20 border border-white/20 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" placeholder="Your Name" maxLength="50" autoFocus />
                        <button type="submit" disabled={isLoading} className="w-full py-3 font-bold text-white bg-green-600/70 border border-green-500/50 rounded-lg hover:bg-green-600/90 transition-colors shadow-lg disabled:bg-gray-500/50">{isLoading ? 'Logging Time...' : 'Log My Time!'}</button>
                    </form>
                );
            case 'success':
                return (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4 text-yellow-300">Congratulations, {playerNameInput}!</h2>
                        <p className="text-lg text-gray-200">Your time has been logged.</p>
                        <p className="mt-4 text-xl">You are the <span className="font-bold text-white">{solveRank}{solveRank === 1 ? 'st' : solveRank === 2 ? 'nd' : solveRank === 3 ? 'rd' : 'th'}</span> person to solve this puzzle!</p>
                    </div>
                );
            case 'locked': case 'inactive': case 'already_solved': case 'error':
                const messages = { locked: "Too many incorrect attempts.", inactive: "This puzzle is not currently active.", already_solved: "You have already solved this puzzle.", error: "An error occurred. Please try again later." };
                return (<div className="text-center"><h2 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h2><p className="text-lg text-gray-300">{messages[step] || error}</p></div>);
            default: return null;
        }
    };

    return (
        <div className="main-background flex flex-col items-center justify-center min-h-screen p-4">
            <Head><title>Solve Puzzle #{puzzle.puzzleNumber}</title></Head>
            <div className="w-full max-w-sm mx-auto bg-slate-900/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8 text-center text-white">
                <div className="mb-6"><h1 className="text-3xl md:text-4xl font-bold text-cyan-300">Plugab</h1><p className="text-gray-300 mt-1">Puzzle #{puzzle.puzzleNumber}: {puzzle.title}</p></div>
                <div className="min-h-[150px] flex items-center justify-center">{renderContent()}</div>
                {error && <p className="mt-4 text-red-400 animate-pulse">{error}</p>}
            </div>
        </div>
    );
}