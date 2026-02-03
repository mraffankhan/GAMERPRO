'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-auth';
import TournamentCard from '@/components/TournamentCard';
import { useRouter } from 'next/navigation';

const FILTERS = {
    games: ["All Games", "Valorant", "League of Legends", "Apex Legends", "CS:GO", "Rocket League", "FREE FIRE MAX"],
    regions: ["All Regions", "NA", "EU", "Asia", "India"],
    skills: ["All Levels", "Open", "Amateur", "Pro"]
};

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeGame, setActiveGame] = useState("All Games");
    const [activeRegion, setActiveRegion] = useState("All Regions");
    const [activeSkill, setActiveSkill] = useState("All Levels");
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchTournaments = async () => {
            const { data } = await supabase
                .from('tournaments')
                .select('*')
                .order('start_date', { ascending: true });
            if (data) setTournaments(data);
            setLoading(false);
        };
        fetchTournaments();
    }, []);

    const filteredTournaments = tournaments.filter(t => {
        // Note: Database might not have 'region' or 'skill_level' yet, so we default to matching if missing
        // We Map 'game' from DB.
        const gameMatch = activeGame === "All Games" || t.game === activeGame;
        // For now assuming region/skill are not in DB, so ignoring them or checking if they exist
        const regionMatch = activeRegion === "All Regions" || (t.region && t.region === activeRegion);
        const skillMatch = activeSkill === "All Levels" || (t.skill_level && t.skill_level === activeSkill);
        const searchMatch = t.title ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) : (t.name ? t.name.toLowerCase().includes(searchQuery.toLowerCase()) : false);

        return gameMatch && searchMatch;
    });

    return (
        <div className="min-h-screen bg-background pt-24 pb-20 font-body">
            {/* Header */}
            <section className="container mb-12">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 font-heading tracking-tighter">
                    FIND YOUR <span className="text-neon-green contrast-125 drop-shadow-[0_0_10px_rgba(0,255,148,0.5)]">BATTLEGROUND</span>
                </h1>

                {/* Search & Filters */}
                <div className="flex flex-col gap-6 bg-bg-secondary/50 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search tournaments..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-4 px-6 text-white focus:outline-none focus:border-neon-blue transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                            🔍
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {/* Game Filter */}
                        <select
                            className="bg-black/40 border border-white/10 text-white py-3 px-4 rounded-lg focus:outline-none focus:border-neon-blue cursor-pointer hover:bg-white/5 transition-colors"
                            value={activeGame}
                            onChange={(e) => setActiveGame(e.target.value)}
                        >
                            {FILTERS.games.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>

                        {/* Region Filter - Visual only for now if DB doesn't support */}
                        <select
                            className="bg-black/40 border border-white/10 text-white py-3 px-4 rounded-lg focus:outline-none focus:border-neon-blue cursor-pointer hover:bg-white/5 transition-colors"
                            value={activeRegion}
                            onChange={(e) => setActiveRegion(e.target.value)}
                        >
                            {FILTERS.regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        {/* Skill Filter - Visual only for now */}
                        <select
                            className="bg-black/40 border border-white/10 text-white py-3 px-4 rounded-lg focus:outline-none focus:border-neon-blue cursor-pointer hover:bg-white/5 transition-colors"
                            value={activeSkill}
                            onChange={(e) => setActiveSkill(e.target.value)}
                        >
                            {FILTERS.skills.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </section>

            {/* Results Grid */}
            <section className="container">
                <div className="flex justify-between items-center mb-6 text-gray-400 text-sm">
                    <span>Showing {filteredTournaments.length} results</span>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
                    </div>
                ) : filteredTournaments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredTournaments.map(tournament => (
                            <TournamentCard
                                key={tournament.id}
                                tournament={{
                                    ...tournament,
                                    title: tournament.name || tournament.title, // Handle DB field mismatch
                                    prize_pool: tournament.prize || tournament.prize_pool,
                                    teams_registered: tournament.teams_registered || 0, // Fallback
                                    max_teams: tournament.max_teams || 16 // Fallback
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/5">
                        <p className="text-xl text-gray-400">No tournaments found matching your filters.</p>
                        <button
                            className="mt-4 text-neon-blue hover:underline"
                            onClick={() => {
                                setActiveGame("All Games");
                                setActiveRegion("All Regions");
                                setActiveSkill("All Levels");
                                setSearchQuery("");
                            }}
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
