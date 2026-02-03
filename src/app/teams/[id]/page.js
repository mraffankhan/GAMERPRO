'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function TeamPage() {
    const { id } = useParams();
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [challenging, setChallenging] = useState(false);

    useEffect(() => {
        const fetchTeam = async () => {
            // Fetch Team
            const { data: teamData } = await supabase
                .from('teams')
                .select('*')
                .eq('id', id)
                .single();
            setTeam(teamData);

            if (teamData) {
                // Fetch Members with Profiles
                const { data: memberData } = await supabase
                    .from('team_members')
                    .select('*, profiles(*)')
                    .eq('team_id', id);
                setMembers(memberData || []);
            }
            setLoading(false);
        };
        fetchTeam();
    }, [id]);

    const handleChallenge = () => {
        setChallenging(true);
        setTimeout(() => {
            alert('Scrim challenge sent! The team captain will be notified.');
            setChallenging(false);
        }, 1500);
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading Team...</div>;

    if (!team) return (
        <div className="min-h-screen bg-background flex items-center justify-center text-white flex-col gap-4">
            <h1 className="text-4xl font-bold">Team Not Found</h1>
            <Link href="/teams" className="text-neon-blue hover:underline">Return to Teams List</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pt-24 pb-20 font-body">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Team Header */}
                <div className="bg-[#111] rounded-3xl border border-white/10 p-10 mb-8 relative overflow-hidden text-center md:text-left">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green"></div>

                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        {/* Logo */}
                        <div className="w-40 h-40 bg-black rounded-2xl border-2 border-white/10 flex items-center justify-center shadow-2xl relative group">
                            <div className="absolute inset-0 bg-neon-blue/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-6xl font-black text-white relative z-10 font-heading">
                                {team.name.substring(0, 2).toUpperCase()}
                            </span>
                        </div>

                        <div className="flex-1">
                            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 font-heading tracking-tighter uppercase relative inline-block">
                                {team.name}
                                <span className="absolute -top-4 -right-8 text-sm bg-neon-green text-black px-2 py-1 rounded font-bold rotate-12">PRO</span>
                            </h1>

                            <div className="flex flex-wrap justify-center md:justify-start gap-8 mb-6">
                                <div className="text-center md:text-left">
                                    <div className="text-3xl font-bold text-white">#{team.rank || '128'}</div>
                                    <div className="text-gray-500 text-xs uppercase tracking-widest">Global Rank</div>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="text-3xl font-bold text-neon-blue">82%</div>
                                    <div className="text-gray-500 text-xs uppercase tracking-widest">Win Rate</div>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="text-3xl font-bold text-neon-green">{members.length}</div>
                                    <div className="text-gray-500 text-xs uppercase tracking-widest">Members</div>
                                </div>
                            </div>

                            <button
                                onClick={handleChallenge}
                                disabled={challenging}
                                className="btn btn-primary px-8 py-3 text-lg clip-diagonal hover:scale-105 active:scale-95 transition-transform"
                            >
                                {challenging ? 'Sending...' : '⚔️ Challenge to Scrim'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Roster Grid */}
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 font-heading decoration-neon-purple underline underline-offset-8 decoration-4">
                    Active Roster
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {members.map((member) => (
                        <div key={member.id} className="bg-[#151515] rounded-xl overflow-hidden group border border-white/5 hover:border-neon-purple/50 transition-all duration-300 hover:-translate-y-2">
                            <div className="h-24 bg-gradient-to-br from-[#222] to-[#111] relative">
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20"></div>
                            </div>
                            <div className="px-6 pb-6 relative">
                                <div className="w-20 h-20 bg-black rounded-full border-4 border-[#151515] -mt-10 mb-3 mx-auto overflow-hidden">
                                    {member.profiles?.avatar_url ? (
                                        <img src={member.profiles.avatar_url} alt={member.profiles.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white mb-1">{member.profiles?.full_name || member.profiles?.username || 'Unknown Player'}</h3>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${member.role === 'captain'
                                            ? 'bg-neon-gold/10 text-neon-gold border border-neon-gold/30'
                                            : 'bg-white/5 text-gray-400 border border-white/10'
                                        }`}>
                                        {member.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty Slot Placeholder */}
                    {members.length < 5 && (
                        <div className="bg-[#111] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-8 opacity-50 hover:opacity-100 hover:border-neon-green/30 transition-all cursor-pointer group">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform">+</div>
                            <span className="text-gray-400 font-bold">Recruiting</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
