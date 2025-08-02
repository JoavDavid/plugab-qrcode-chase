import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import {QRCodeCanvas} from 'qrcode.react';

export default function PuzzleManager() {
    const [puzzles, setPuzzles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [puzzleNumber, setPuzzleNumber] = useState('');
    const [locationHint, setLocationHint] = useState('');

    useEffect(() => {
        setIsLoading(true);
        const q = collection(firestore, 'puzzles');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const puzzlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            puzzlesData.sort((a, b) => a.puzzleNumber - b.puzzleNumber);
            setPuzzles(puzzlesData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCreatePuzzle = async (e) => {
        e.preventDefault();
        if (!title || !puzzleNumber) return alert('Please fill in all fields.');
        try {
            await addDoc(collection(firestore, 'puzzles'), {
                title,
                puzzleNumber: parseInt(puzzleNumber, 10),
                locationHint,
                status: 'inactive',
                createdAt: serverTimestamp(),
                solveCount: 0,
            });
            setTitle('');
            setPuzzleNumber('');
            setLocationHint('');
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error creating puzzle:", error);
            alert("Failed to create puzzle.");
        }
    };

    const togglePuzzleStatus = async (puzzleId, currentStatus) => {
        const puzzleRef = doc(firestore, 'puzzles', puzzleId);
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        await updateDoc(puzzleRef, { status: newStatus });
    };

    const getSolveUrl = (puzzleId) => {
        return typeof window !== 'undefined' ? `${window.location.origin}/s/${puzzleId}` : '';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Manage Puzzles</h3>
                <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 font-bold text-white bg-cyan-500/50 border border-cyan-400/50 rounded-lg shadow-lg hover:bg-cyan-500/70 hover:shadow-cyan-500/40 transition-all backdrop-blur-sm">
                    + Create Puzzle
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity">
                    <div className="bg-slate-900/70 border border-white/20 rounded-xl shadow-2xl p-8 w-full max-w-md text-white">
                        <h4 className="text-2xl font-bold mb-6">New Puzzle</h4>
                        <form onSubmit={handleCreatePuzzle}>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Puzzle Title" className="w-full p-3 mb-4 bg-black/20 border border-white/20 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" required />
                            <input type="number" value={puzzleNumber} onChange={e => setPuzzleNumber(e.target.value)} placeholder="Secret Puzzle Number" className="w-full p-3 mb-4 bg-black/20 border border-white/20 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" required />
                            <textarea value={locationHint} onChange={e => setLocationHint(e.target.value)} placeholder="Location Hint (for admin reference)" className="w-full p-3 mb-4 bg-black/20 border border-white/20 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" />
                            <div className="flex justify-end gap-4 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-300 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2 font-bold text-white bg-green-500/70 border border-green-400/50 rounded-lg hover:bg-green-500/90 transition-all">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-slate-900/70 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                {isLoading ? <p className="p-6 text-center text-gray-300">Loading puzzles...</p> : (
                    <ul className="divide-y divide-white/10">
                        {puzzles.map(puzzle => (
                            <li key={puzzle.id} className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-slate-800/50 transition-colors">
                                <div className="flex-1 mb-4 md:mb-0 md:mr-4">
                                    <h4 className="text-lg font-bold text-cyan-400">#{puzzle.puzzleNumber} - {puzzle.title}</h4>
                                    <p className="text-sm text-gray-300 mt-1">{puzzle.locationHint || 'No location hint'}</p>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="bg-white p-2 rounded-lg shadow-md"><QRCodeCanvas value={getSolveUrl(puzzle.id)} size={80} bgColor="#FFFFFF" fgColor="#000000"/></div>
                                    <div className="text-center">
                                        <button onClick={() => togglePuzzleStatus(puzzle.id, puzzle.status)} className={`px-3 py-1.5 w-24 text-sm font-semibold rounded-full shadow-md transition-all ${puzzle.status === 'active' ? 'bg-green-500/80 text-white border border-green-400/50' : 'bg-gray-600/60 text-gray-200 border border-gray-500/50'}`}>
                                            {puzzle.status === 'active' ? 'Active' : 'Inactive'}
                                        </button>
                                        <p className="text-sm mt-2 text-gray-300">{puzzle.solveCount || 0} solves</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {puzzles.length === 0 && !isLoading && <p className="p-6 text-center text-gray-400">No puzzles created yet.</p>}
            </div>
        </div>
    );
}