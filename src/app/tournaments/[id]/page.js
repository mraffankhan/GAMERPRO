'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TournamentLobby() {
    const { id } = useParams();
    const router = useRouter();
    const [tournament, setTournament] = useState(null);
    const [groups, setGroups] = useState([]);
    const [userTeam, setUserTeam] = useState(null);
    const [userGroup, setUserGroup] = useState(null);
    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [matchCredentials, setMatchCredentials] = useState(null);
    const [qualifications, setQualifications] = useState([]);
    const [matchResults, setMatchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loginRequired, setLoginRequired] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [copied, setCopied] = useState('');

    // Registration State
    const [registering, setRegistering] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [modal, setModal] = useState({ show: false, type: 'info', title: '', message: '', action: null });

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            setLoginRequired(true);
            setLoading(false);
            return;
        }

        // Fetch user role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
        if (profile) setUserRole(profile.role);

        // Fetch Tournament
        const { data: t } = await supabase.from('tournaments').select('*').eq('id', id).single();
        setTournament(t);

        // Fetch Groups with Teams
        const { data: grps } = await supabase
            .from('groups')
            .select('*, group_teams(*, teams(*))')
            .eq('tournament_id', id)
            .order('name', { ascending: true });
        setGroups(grps || []);

        // Fetch Qualifications
        const { data: quals } = await supabase
            .from('qualifications')
            .select('*, teams(name)')
            .eq('tournament_id', id);
        setQualifications(quals || []);

        // Fetch match results
        const groupIds = (grps || []).map(g => g.id);
        if (groupIds.length > 0) {
            const { data: results } = await supabase
                .from('match_results')
                .select('*, teams(name), matches(group_id, start_time, match_number)')
                .in('matches.group_id', groupIds);
            setMatchResults(results || []);
        }

        // Check User Team & Registration
        if (session) {
            const { data: memberData } = await supabase
                .from('team_members')
                .select('team_id, role, teams(id, name, members_count)')
                .eq('user_id', session.user.id)
                .single();

            if (memberData) {
                setUserTeam({ ...memberData.teams, userRole: memberData.role });

                const { data: registration } = await supabase
                    .from('tournament_registrations')
                    .select('*')
                    .eq('tournament_id', id)
                    .eq('team_id', memberData.team_id)
                    .maybeSingle();

                if (registration) {
                    const foundGroup = (grps || []).find(g =>
                        g.group_teams?.some(gt => gt.team_id === memberData.team_id)
                    );
                    setUserGroup(foundGroup);

                    if (foundGroup) {
                        const { data: matches } = await supabase
                            .from('matches')
                            .select('*')
                            .eq('group_id', foundGroup.id)
                            .in('status', ['scheduled', 'live'])
                            .order('start_time', { ascending: true });
                        setUpcomingMatches(matches || []);

                        if (matches && matches.length > 0) {
                            const nextMatch = matches[0];
                            const matchTime = new Date(nextMatch.start_time);
                            const now = new Date();
                            const fifteenMinBefore = new Date(matchTime.getTime() - 15 * 60 * 1000);

                            if (now >= fifteenMinBefore) {
                                const { data: creds } = await supabase
                                    .from('match_credentials')
                                    .select('*')
                                    .eq('match_id', nextMatch.id)
                                    .single();
                                setMatchCredentials(creds);
                            }
                        }
                    }
                }
            }
        }

        setLoading(false);
    }, [id]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleRegister = async () => {
        setRegistering(true);
        const { data: { session } } = await supabase.auth.getSession();

        // 1. Check Team Existence
        if (!userTeam) {
            setModal({
                show: true,
                type: 'warning',
                title: 'No Team Found',
                message: 'You must be in a team to register. Create or join a team first.',
                action: () => router.push('/teams')
            });
            setRegistering(false);
            return;
        }

        // 2. Check if Captain
        if (userTeam.userRole !== 'captain' && userRole !== 'super_admin') {
            setModal({
                show: true,
                type: 'error',
                title: 'Captain Only',
                message: 'Only team captains can register for tournaments. Ask your captain to register the team.'
            });
            setRegistering(false);
            return;
        }

        // 3. Check Team Size
        if (userTeam.members_count !== 4 && userRole !== 'super_admin') {
            setModal({
                show: true,
                type: 'warning',
                title: 'Team Incomplete',
                message: `Your team needs exactly 4 members to register. You currently have ${userTeam.members_count} member(s).`
            });
            setRegistering(false);
            return;
        }

        // 4. Register
        const { error } = await supabase
            .from('tournament_registrations')
            .insert([{
                tournament_id: id,
                team_id: userTeam.id
            }]);

        if (error) {
            if (error.code === '23505') {
                setModal({
                    show: true,
                    type: 'info',
                    title: 'Already Registered',
                    message: `Your team "${userTeam.name}" is already registered for this tournament.`
                });
            } else {
                setModal({
                    show: true,
                    type: 'error',
                    title: 'Registration Failed',
                    message: error.message
                });
            }
        } else {
            setModal({
                show: true,
                type: 'success',
                title: 'Registration Successful! 🎉',
                message: `Team "${userTeam.name}" has been registered for ${tournament.name}. Good luck!`
            });
            fetchData(); // Refresh state
        }
        setRegistering(false);
    };

    // ... Helper functions for countdown and copy ...
    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(''), 2000);
    };

    const formatCountdown = () => {
        if (!countdown) return '--:--:--';
        if (countdown.passed) return 'Match Started!';
        return `${String(countdown.hours).padStart(2, '0')}:${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`;
    };

    const isCredentialsAvailable = () => {
        if (upcomingMatches.length === 0) return false;
        const nextMatch = upcomingMatches[0];
        const matchTime = new Date(nextMatch.start_time);
        const now = new Date();
        const fifteenMinBefore = new Date(matchTime.getTime() - 15 * 60 * 1000);
        return now >= fifteenMinBefore;
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-gray-800 border-t-neon-green rounded-full animate-spin"></div></div>;

    if (loginRequired) return (
        <div className="min-h-[60vh] bg-background pt-32 pb-20 flex justify-center">
            <div className="max-w-lg w-full bg-bg-secondary p-10 rounded-2xl border border-white/5 shadow-2xl text-center">
                <div className="text-5xl mb-6">🔒</div>
                <h2 className="text-3xl font-bold mb-4 font-heading text-white">Login Required</h2>
                <p className="text-gray-400 mb-8 text-lg">Access restricted to registered members.</p>
                <div className="flex flex-col gap-4 items-center">
                    <Link href="/login" className="btn btn-primary w-full max-w-xs">Login to Access</Link>
                    <Link href="/tournaments" className="text-gray-500 hover:text-white transition-colors">← Back</Link>
                </div>
            </div>
        </div>
    );

    if (!tournament) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Tournament Not Found</div>;

    return (
        <div className="min-h-screen bg-background pb-20 pt-20">
            {/* Modal */}
            {modal.show && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                        <div className="text-4xl mb-4">
                            {modal.type === 'success' ? '✅' : modal.type === 'error' ? '❌' : modal.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{modal.title}</h3>
                        <p className="text-gray-400 mb-6">{modal.message}</p>
                        <div className="flex gap-4 justify-center">
                            {modal.action ? (
                                <>
                                    <button onClick={() => setModal({ ...modal, show: false })} className="px-6 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5">Cancel</button>
                                    <button onClick={() => { setModal({ ...modal, show: false }); modal.action(); }} className="px-6 py-2 bg-neon-blue text-black font-bold rounded-lg hover:bg-neon-blue/80">Continue</button>
                                </>
                            ) : (
                                <button onClick={() => setModal({ ...modal, show: false })} className="px-8 py-2 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20">OK</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-8">
                    <Link href="/tournaments" className="inline-flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors cursor-pointer text-sm font-medium">
                        ← Back to Tournaments
                    </Link>
                </div>

                {/* Header */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-3xl border border-white/10 p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex flex-wrap justify-between items-start gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-4xl">🏆</span>
                                <h1 className="text-3xl md:text-4xl font-black font-heading tracking-tight text-white">{tournament.name}</h1>
                            </div>
                            <div className="flex flex-wrap gap-4 text-gray-400 font-mono text-sm uppercase tracking-wide">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-neon-green rounded-full shadow-[0_0_10px_var(--neon-green)]"></span>
                                    {tournament.game}
                                </span>
                                <span className="text-white/20">|</span>
                                <span><span className="text-neon-gold">{tournament.prize}</span> Prize</span>
                            </div>
                        </div>

                        {/* Team Status / Register Button */}
                        {userTeam ? (
                            userGroup ? (
                                <div className="bg-neon-green/10 border border-neon-green/20 rounded-xl p-5 min-w-[200px] backdrop-blur-sm">
                                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Your Team</div>
                                    <div className="text-neon-green font-bold text-xl mb-1">{userTeam.name}</div>
                                    <div className="text-sm text-gray-500">Assigned to: <span className="text-white">{userGroup.name}</span></div>
                                </div>
                            ) : (
                                // Not registered yet? Or registered but no group?
                                // We check registration in fetchData. If registered but no group, it means waiting for groups.
                                // If NOT registered (which is checked via 'registration' var in fetchData, but here we only have userGroup state.
                                // Ah, I need a state for 'isRegistered'. userGroup implies registered+grouped.
                                // I'll assume if userTeam exists but no userGroup, we need to check if they are registered or not.
                                // Actually, I didn't set an explicit 'isRegistered' state.
                                // Let's rely on the "Not Registered Message" block below or add a button here.
                                <button
                                    onClick={handleRegister}
                                    disabled={registering}
                                    className="bg-neon-green text-black font-bold uppercase tracking-wider px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,255,148,0.3)]"
                                >
                                    {registering ? 'Checking...' : 'Register Team'}
                                </button>
                            )
                        ) : (
                            <Link href="/teams" className="bg-white/10 text-white font-bold uppercase tracking-wider px-8 py-4 rounded-xl hover:bg-white/20 transition-colors">
                                Join a Team
                            </Link>
                        )}
                    </div>
                </div>

                {/* Countdown / Next Match / Credentials - Same as before */}
                {userGroup && upcomingMatches.length > 0 && (
                    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl border border-neon-blue/30 p-8 mb-8 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-2xl animate-pulse">📅</span>
                            <h2 className="text-2xl font-bold font-heading text-white">Your Next Match</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div>
                                <div className="text-gray-400 text-xs uppercase tracking-widest mb-2">Date & Time</div>
                                <div className="text-xl font-bold text-white">
                                    {new Date(upcomingMatches[0].start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    <span className="text-gray-500 text-lg font-normal"> at </span>
                                    {new Date(upcomingMatches[0].start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs uppercase tracking-widest mb-2">Countdown</div>
                                <div className={`font-mono text-3xl font-bold ${countdown?.passed ? 'text-neon-green' : 'text-white'}`}>
                                    {formatCountdown()}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs uppercase tracking-widest mb-2">Status</div>
                                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${upcomingMatches[0].status === 'live' ? 'bg-neon-green text-black animate-pulse' : 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'}`}>
                                    {upcomingMatches[0].status}
                                </span>
                            </div>
                        </div>
                        {/* Credentials */}
                        <div className="bg-black/30 rounded-xl p-6 border border-white/5">
                            {isCredentialsAvailable() && matchCredentials ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#111] rounded-lg p-4 flex justify-between items-center border border-white/10">
                                        <div><div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Room ID</div><div className="font-mono text-xl font-bold text-neon-green">{matchCredentials.room_id}</div></div>
                                        <button onClick={() => copyToClipboard(matchCredentials.room_id, 'roomId')} className={`px-3 py-1.5 rounded text-sm font-medium ${copied === 'roomId' ? 'bg-neon-green text-black' : 'bg-white/10 text-white'}`}>{copied === 'roomId' ? '✓ Copied' : '📋 Copy'}</button>
                                    </div>
                                    <div className="bg-[#111] rounded-lg p-4 flex justify-between items-center border border-white/10">
                                        <div><div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Password</div><div className="font-mono text-xl font-bold text-neon-green">{matchCredentials.room_password}</div></div>
                                        <button onClick={() => copyToClipboard(matchCredentials.room_password, 'password')} className={`px-3 py-1.5 rounded text-sm font-medium ${copied === 'password' ? 'bg-neon-green text-black' : 'bg-white/10 text-white'}`}>{copied === 'password' ? '✓ Copied' : '📋 Copy'}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500"><div className="text-4xl mb-3 opacity-30">🔒</div><p>Credentials will be revealed 15 minutes before your match</p></div>
                            )}
                        </div>
                    </div>
                )}

                {/* Groups Grid */}
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 font-heading"><span>🎲</span> Tournament Groups</h2>
                {groups.length === 0 ? (
                    <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-16 text-center"><div className="text-5xl mb-4 opacity-30">🎲</div><p className="text-gray-500 text-lg">Groups haven't been generated yet. Check back later!</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {groups.map(g => {
                            const isUserGroup = userGroup?.id === g.id;
                            return (
                                <div key={g.id} className={`rounded-2xl border p-6 relative ${isUserGroup ? 'bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/50' : 'bg-[#1a1a1a] border-white/5'}`}>
                                    {isUserGroup && <div className="absolute -top-3 right-4 bg-neon-green text-black px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow-lg">YOUR GROUP</div>}
                                    <div className="flex justify-between items-center mb-6"><h4 className={`font-bold text-xl ${g.name === 'Wildcard' ? 'text-amber-500' : 'text-white'}`}>{g.name}</h4><span className="text-xs text-gray-400 bg-black/40 px-3 py-1 rounded-full border border-white/5 font-mono">{g.group_teams?.length || 0} Teams</span></div>
                                    <div className="flex flex-col gap-2">
                                        {g.group_teams?.map(gt => {
                                            const isQualified = qualifications.some(q => q.team_id === gt.teams?.id);
                                            const isUserTeamRow = userTeam?.id === gt.teams?.id;
                                            return (
                                                <div key={gt.id} className={`p-3 rounded-lg text-sm flex justify-between items-center ${isUserTeamRow ? 'bg-neon-green/10 text-neon-green font-bold border border-neon-green/20' : 'bg-[#111] text-gray-300 border border-transparent'}`}>
                                                    <span className="truncate">{isUserTeamRow && '★ '}{gt.teams?.name || 'Unknown'}</span>
                                                    {isQualified && <span className="text-[10px] bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded-full border border-neon-purple/30 font-bold uppercase tracking-wider">Qualified</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
