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
    const [countdown, setCountdown] = useState(null);
    const [copied, setCopied] = useState('');

    const fetchData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();

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

        // Fetch all match results for this tournament's groups
        const groupIds = (grps || []).map(g => g.id);
        if (groupIds.length > 0) {
            const { data: results } = await supabase
                .from('match_results')
                .select('*, teams(name), matches(group_id, start_time, match_number)')
                .in('matches.group_id', groupIds);
            setMatchResults(results || []);
        }

        // If user is logged in, find their team and group
        if (session) {
            const { data: memberData } = await supabase
                .from('team_members')
                .select('team_id, teams(id, name)')
                .eq('user_id', session.user.id)
                .single();

            if (memberData) {
                setUserTeam(memberData.teams);

                // Check if user's team is registered in this tournament
                const { data: registration } = await supabase
                    .from('tournament_registrations')
                    .select('*')
                    .eq('tournament_id', id)
                    .eq('team_id', memberData.team_id)
                    .single();

                if (registration) {
                    // Find user's group
                    const foundGroup = (grps || []).find(g =>
                        g.group_teams?.some(gt => gt.team_id === memberData.team_id)
                    );
                    setUserGroup(foundGroup);

                    // Fetch upcoming matches for user's group
                    if (foundGroup) {
                        const { data: matches } = await supabase
                            .from('matches')
                            .select('*')
                            .eq('group_id', foundGroup.id)
                            .in('status', ['scheduled', 'live'])
                            .order('start_time', { ascending: true });
                        setUpcomingMatches(matches || []);

                        // Check for credentials (only visible 15 min before)
                        if (matches && matches.length > 0) {
                            const nextMatch = matches[0];
                            const matchTime = new Date(nextMatch.start_time);
                            const now = new Date();
                            const fifteenMinBefore = new Date(matchTime.getTime() - 15 * 60 * 1000);

                            if (now >= fifteenMinBefore) {
                                // Credentials should be visible - fetch from match_credentials
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

        // Refresh data every 30 seconds for live updates
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Countdown timer for next match
    useEffect(() => {
        if (upcomingMatches.length === 0) return;

        const nextMatch = upcomingMatches[0];
        const matchTime = new Date(nextMatch.start_time);

        const updateCountdown = () => {
            const now = new Date();
            const diff = matchTime - now;

            if (diff <= 0) {
                setCountdown({ hours: 0, minutes: 0, seconds: 0, passed: true });
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ hours, minutes, seconds, passed: false });

            // Check if we just passed the 15-min mark
            const fifteenMinBefore = new Date(matchTime.getTime() - 15 * 60 * 1000);
            if (now >= fifteenMinBefore && !matchCredentials) {
                fetchData(); // Refresh to get credentials
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, [upcomingMatches, matchCredentials, fetchData]);

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

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #333', borderTop: '3px solid #34d399', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                    <p style={{ color: '#888' }}>Loading tournament...</p>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏆</div>
                    <h2 style={{ marginBottom: '12px' }}>Tournament Not Found</h2>
                    <Link href="/tournaments" style={{ color: '#34d399' }}>← Back to Tournaments</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Back Navigation */}
                <div style={{ marginBottom: '24px' }}>
                    <Link href="/tournaments" style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: '100px', color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}>
                            ← Back to Tournaments
                        </div>
                    </Link>
                </div>

                {/* Tournament Header */}
                <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)', borderRadius: '20px', border: '1px solid #333', padding: '32px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '2.5rem' }}>🏆</span>
                                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{tournament.name}</h1>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#888' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%' }}></span>
                                    {tournament.game}
                                </span>
                                <span>|</span>
                                <span>{tournament.prize} Prize</span>
                                <span>|</span>
                                <span>Stage: <span style={{ color: '#4f46e5', fontWeight: '600' }}>{tournament.current_stage || 'Qualifiers'}</span></span>
                            </div>
                        </div>
                        {userTeam && (
                            <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '12px', padding: '16px 20px' }}>
                                <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>Your Team</div>
                                <div style={{ color: '#34d399', fontWeight: '600', fontSize: '1.1rem' }}>{userTeam.name}</div>
                                {userGroup && (
                                    <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '4px' }}>
                                        Assigned to: <span style={{ color: '#fff' }}>{userGroup.name}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Next Match Card (for registered players) */}
                {userGroup && upcomingMatches.length > 0 && (
                    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px', border: '1px solid #4f46e5', padding: '32px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <span style={{ fontSize: '1.5rem' }}>📅</span>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: '600' }}>Your Next Match</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                            <div>
                                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '6px' }}>Date & Time</div>
                                <div style={{ color: '#fff', fontWeight: '600', fontSize: '1.1rem' }}>
                                    {new Date(upcomingMatches[0].start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    <span style={{ color: '#888' }}> at </span>
                                    {new Date(upcomingMatches[0].start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '6px' }}>Countdown</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 'bold', color: countdown?.passed ? '#34d399' : '#fff' }}>
                                    {formatCountdown()}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '6px' }}>Status</div>
                                <span style={{ padding: '6px 14px', background: upcomingMatches[0].status === 'live' ? '#34d399' : '#4f46e5', borderRadius: '100px', fontSize: '0.9rem', fontWeight: '600', color: upcomingMatches[0].status === 'live' ? '#000' : '#fff', textTransform: 'capitalize' }}>
                                    {upcomingMatches[0].status}
                                </span>
                            </div>
                        </div>

                        {/* Credentials Section */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px', border: '1px solid #333' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🔐</span>
                                <span style={{ fontWeight: '600' }}>Room Credentials</span>
                                {!isCredentialsAvailable() && (
                                    <span style={{ fontSize: '0.8rem', color: '#f59e0b', marginLeft: 'auto' }}>
                                        Available 15 min before match
                                    </span>
                                )}
                            </div>

                            {isCredentialsAvailable() && matchCredentials ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ background: '#111', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>Room ID</div>
                                            <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 'bold', color: '#34d399' }}>
                                                {matchCredentials.room_id}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(matchCredentials.room_id, 'roomId')}
                                            style={{ padding: '8px 12px', background: copied === 'roomId' ? '#34d399' : '#333', border: 'none', borderRadius: '6px', color: copied === 'roomId' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.9rem' }}
                                        >
                                            {copied === 'roomId' ? '✓ Copied' : '📋 Copy'}
                                        </button>
                                    </div>
                                    <div style={{ background: '#111', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>Password</div>
                                            <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 'bold', color: '#34d399' }}>
                                                {matchCredentials.room_password}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(matchCredentials.room_password, 'password')}
                                            style={{ padding: '8px 12px', background: copied === 'password' ? '#34d399' : '#333', border: 'none', borderRadius: '6px', color: copied === 'password' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.9rem' }}
                                        >
                                            {copied === 'password' ? '✓ Copied' : '📋 Copy'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>🔒</div>
                                    <p>Credentials will be revealed 15 minutes before your match</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Not Registered Message */}
                {!userTeam && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👋</div>
                        <h3 style={{ marginBottom: '8px', color: '#f59e0b' }}>You're Not Registered</h3>
                        <p style={{ color: '#888', marginBottom: '16px' }}>Join or create a team to participate in this tournament.</p>
                        <Link href="/teams" style={{ display: 'inline-block', padding: '12px 24px', background: '#f59e0b', borderRadius: '8px', color: '#000', fontWeight: '600', textDecoration: 'none' }}>
                            Go to Teams →
                        </Link>
                    </div>
                )}

                {/* Groups Grid */}
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🎲</span> Tournament Groups
                </h2>

                {groups.length === 0 ? (
                    <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #333', padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '16px', opacity: 0.3 }}>🎲</div>
                        <p style={{ color: '#888' }}>Groups haven't been generated yet. Check back later!</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                        {groups.map(g => {
                            const isUserGroup = userGroup?.id === g.id;
                            return (
                                <div key={g.id} style={{
                                    background: isUserGroup ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' : '#1a1a1a',
                                    borderRadius: '16px',
                                    border: isUserGroup ? '2px solid #34d399' : '1px solid #333',
                                    padding: '24px',
                                    position: 'relative'
                                }}>
                                    {isUserGroup && (
                                        <div style={{ position: 'absolute', top: '-12px', right: '16px', background: '#34d399', color: '#000', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '600' }}>
                                            YOUR GROUP
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h4 style={{ fontWeight: 'bold', fontSize: '1.2rem', color: g.name === 'Wildcard' ? '#f59e0b' : '#fff' }}>{g.name}</h4>
                                        <span style={{ fontSize: '0.85rem', color: '#666', background: '#222', padding: '4px 10px', borderRadius: '100px' }}>
                                            {g.group_teams?.length || 0} Teams
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {g.group_teams?.map(gt => {
                                            const isQualified = qualifications.some(q => q.team_id === gt.teams?.id);
                                            const isUserTeamRow = userTeam?.id === gt.teams?.id;
                                            return (
                                                <div key={gt.id} style={{
                                                    padding: '12px 14px',
                                                    background: isUserTeamRow ? 'rgba(52, 211, 153, 0.15)' : '#111',
                                                    borderRadius: '8px',
                                                    fontSize: '0.95rem',
                                                    color: isUserTeamRow ? '#34d399' : '#ccc',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    border: isUserTeamRow ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid transparent'
                                                }}>
                                                    <span style={{ fontWeight: isUserTeamRow ? '600' : '400' }}>
                                                        {isUserTeamRow && '★ '}{gt.teams?.name || 'Unknown'}
                                                    </span>
                                                    {isQualified && (
                                                        <span style={{ fontSize: '0.75rem', color: '#4f46e5', background: 'rgba(79, 70, 229, 0.1)', padding: '3px 10px', borderRadius: '100px' }}>
                                                            Qualified ✓
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tournament Stages */}
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🚀</span> Tournament Stages
                </h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
                    {(tournament.stages || ['Qualifiers', 'Quarter', 'Semi', 'Final', 'Grand Final']).map((stage, i) => {
                        const isCurrentStage = stage === (tournament.current_stage || 'Qualifiers');
                        const currentIndex = (tournament.stages || []).indexOf(tournament.current_stage || 'Qualifiers');
                        const isPastStage = i < currentIndex;
                        return (
                            <div key={i} style={{
                                padding: '16px 24px',
                                background: isCurrentStage ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : isPastStage ? 'rgba(52, 211, 153, 0.1)' : '#1a1a1a',
                                borderRadius: '12px',
                                border: isCurrentStage ? 'none' : isPastStage ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid #333',
                                minWidth: '120px',
                                textAlign: 'center'
                            }}>
                                <span style={{ color: '#888', fontSize: '0.75rem', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Stage {i + 1}</span>
                                <span style={{ fontWeight: '600', fontSize: '1rem', color: isCurrentStage ? '#fff' : isPastStage ? '#34d399' : '#aaa' }}>
                                    {isPastStage && '✓ '}{stage}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666', fontSize: '0.9rem' }}>
                    <p>Updates refresh automatically every 30 seconds</p>
                </div>
            </div>
        </div>
    );
}
