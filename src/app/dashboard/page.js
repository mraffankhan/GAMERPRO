'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [profile, setProfile] = useState(null);
    const [team, setTeam] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            // Fetch Profile
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            setProfile(userProfile);

            // Fetch Team
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('role, teams(*)')
                .eq('user_id', session.user.id)
                .maybeSingle(); // Use maybeSingle to avoid error if no team

            if (teamMember) {
                setTeam(teamMember.teams);
            }

            // Mock Matches (Real DB might not have enough data yet)
            setMatches([
                { id: 1, result: 'WIN', score: '13-9', game: 'Valorant', date: '2026-02-01', tournament: 'Neon City Cup' },
                { id: 2, result: 'LOSS', score: '2-1', game: 'Apex Legends', date: '2026-01-28', tournament: 'Weekly Scrims' },
                { id: 3, result: 'WIN', score: '3-0', game: 'Rocket League', date: '2026-01-25', tournament: 'Rocket Rumble' }
            ]);

            setLoading(false);
        };
        fetchData();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-gray-800 border-t-neon-blue rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-20 font-body">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Profile Header */}
                <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/10 flex flex-col md:flex-row items-center gap-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('/grid.png')] opacity-5 pointer-events-none"></div>

                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-neon-blue to-neon-purple p-1">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl">👤</span>
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 w-8 h-8 bg-neon-green rounded-full border-4 border-[#1a1a1a] flex items-center justify-center text-black font-bold text-xs" title="Online">
                            ✓
                        </div>
                    </div>

                    {/* Info */}
                    <div className="text-center md:text-left flex-1 z-10">
                        <h1 className="text-3xl font-bold text-white mb-2 font-heading tracking-wide">
                            {profile?.full_name || profile?.username || 'Warrior'}
                        </h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                                Level 42
                            </span>
                            <span className="px-3 py-1 bg-neon-purple/20 border border-neon-purple/30 rounded-full text-sm text-neon-purple font-bold">
                                {profile?.role === 'super_admin' ? 'Super Admin' : 'Pro Gamer'}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm max-w-md">
                            "Victory is reserved for those who are willing to pay its price."
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-8 text-center bg-black/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm z-10 w-full md:w-auto justify-around md:justify-start">
                        <div>
                            <div className="text-2xl font-bold text-white">86%</div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest">Win Rate</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-neon-green">$1,250</div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest">Earnings</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-neon-blue">#124</div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest">Rank</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column - Menu & Wallet */}
                    <div className="space-y-6">
                        {/* Wallet Card */}
                        <div className="bg-[#111] rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-neon-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-4">Wallet Balance</h3>
                            <div className="text-4xl font-bold text-white mb-2 font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                $420.50
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-neon-green text-black font-bold rounded-lg hover:bg-white transition-colors">Deposit</button>
                                <button className="flex-1 py-2 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors">Withdraw</button>
                            </div>
                        </div>

                        {/* Team Card */}
                        <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                            <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-4">My Team</h3>
                            {team ? (
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-neon-blue/20 rounded-lg flex items-center justify-center text-neon-blue text-lg font-bold border border-neon-blue/30">
                                            {team.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-lg">{team.name}</div>
                                            <div className="text-gray-500 text-sm">{team.members_count} Members</div>
                                        </div>
                                    </div>
                                    <Link href="/teams" className="block w-full text-center py-2 border border-white/10 rounded-lg text-gray-300 hover:text-white hover:border-white/30 transition-colors">
                                        Manage Team
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-gray-500 mb-4">You are not in a team.</p>
                                    <Link href="/teams/create" className="text-neon-blue hover:underline">Create or Join Team</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Match History */}
                    <div className="md:col-span-2">
                        <div className="bg-[#111] rounded-2xl p-8 border border-white/5 min-h-[400px]">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span>⚔️</span> Recent Matches
                            </h2>

                            <div className="space-y-4">
                                {matches.map((match) => (
                                    <div key={match.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-1 h-12 rounded-full ${match.result === 'WIN' ? 'bg-neon-green' : 'bg-red-500'}`}></div>
                                            <div>
                                                <div className="text-white font-bold text-lg">{match.game}</div>
                                                <div className="text-gray-500 text-sm">{match.tournament}</div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`font-bold text-xl ${match.result === 'WIN' ? 'text-neon-green' : 'text-red-500'}`}>
                                                {match.result}
                                            </div>
                                            <div className="text-gray-500 font-mono text-sm">{match.score}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 text-center">
                                <button className="text-gray-500 hover:text-white transition-colors text-sm uppercase tracking-widest font-bold">
                                    View Full History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
