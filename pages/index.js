import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
    return (
        <div className="main-background flex flex-col items-center justify-center min-h-screen text-white p-4">
            <Head>
                <title>Plugab - A Real-World Puzzle Hunt</title>
                <meta name="description" content="Solve puzzles, find QR codes, and race to the top of the leaderboard." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="text-center bg-slate-900/70 backdrop-blur-xl p-10 rounded-2xl border border-white/20 shadow-2xl">
                <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-500">
                    Plugab
                </h1>
                <p className="mt-3 text-2xl text-gray-300">
                    The adventure is waiting.
                </p>
                <div className="mt-8">
                    <Link href="/admin" className="px-6 py-3 font-bold text-white bg-cyan-500/70 border border-cyan-400/50 rounded-lg hover:bg-cyan-500/90 transition-colors shadow-lg hover:shadow-cyan-500/40">
                        Go to Admin Dashboard
                    </Link>
                </div>
            </main>
        </div>
    );
}