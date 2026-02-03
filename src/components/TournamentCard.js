import Link from 'next/link';

export default function TournamentCard({ tournament }) {
    const { id, title, game, prize_pool, start_date, teams_registered, max_teams, status } = tournament;

    // Format price
    const prizeDisplay = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(prize_pool || 0);

    return (
        <div className="card w-full h-full flex flex-col overflow-hidden group">
            {/* Image / Header */}
            <div className="relative h-48 bg-gray-900 overflow-hidden">
                {/* Placeholder for game image */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] to-transparent z-10" />
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 opacity-60"
                    style={{ backgroundImage: `url('/games/${game?.toLowerCase().replace(/\s+/g, '-') || 'default'}.jpg')` }}
                />

                <div className="absolute top-3 right-3 z-20">
                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-neon-blue text-black'}`}>
                        {status}
                    </span>
                </div>

                <div className="absolute bottom-3 left-3 z-20">
                    <span className="text-neon-purple font-bold tracking-wider text-sm bg-black/50 backdrop-blur px-2 py-1 rounded border border-neon-purple/30">
                        {game}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-blue transition-colors truncate">
                    {title}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 font-mono">
                    <div className="flex items-center gap-1">
                        <span>📅</span>
                        {new Date(start_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-neon-green">
                        <span>💰</span>
                        {prizeDisplay}
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex justify-between text-xs text-gray-500 mb-2 uppercase tracking-wide">
                        <span>Slots</span>
                        <span className="text-white">{teams_registered} / {max_teams}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-5">
                        <div
                            className="h-full bg-neon-blue shadow-[0_0_10px_var(--neon-blue)]"
                            style={{ width: `${(teams_registered / max_teams) * 100}%` }}
                        />
                    </div>

                    <Link href={`/tournaments/${id}`} className="block w-full text-center py-3 border border-white/10 hover:border-neon-blue text-white hover:text-neon-blue rounded transition-all uppercase font-bold text-sm tracking-widest bg-white/5 hover:bg-neon-blue/10">
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}
