'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// import { generateGroupChannels } from '@/app/actions';

export default function TournamentDetails() {
    const { id } = useParams();
    const router = useRouter();
    const [tournament, setTournament] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [groups, setGroups] = useState([]);
    const [matches, setMatches] = useState([]);
    const [qualifications, setQualifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, type: '', data: null });
    const [activeTab, setActiveTab] = useState('groups');

    // Match scheduling state
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [matchForm, setMatchForm] = useState({
        start_time: '',
        room_id: '',
        room_password: ''
    });

    // Results entry state
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [resultsForm, setResultsForm] = useState([]);

    const fetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch Tournament
        const { data: t } = await supabase.from('tournaments').select('*').eq('id', id).single();
        setTournament(t);

        // Fetch Registrations with Team details
        const { data: regs } = await supabase
            .from('tournament_registrations')
            .select('*, teams(*)')
            .eq('tournament_id', id);
        setRegistrations(regs || []);

        // Fetch Groups with Teams
        const { data: grps } = await supabase
            .from('groups')
            .select('*, group_teams(*, teams(*))')
            .eq('tournament_id', id)
            .order('name', { ascending: true });
        setGroups(grps || []);

        // Fetch Matches with credentials
        const { data: mtchs } = await supabase
            .from('matches')
            .select('*, groups(name, stage_name)')
            .eq('groups.tournament_id', id)
            .order('start_time', { ascending: true });

        // Filter matches that belong to this tournament's groups
        const groupIds = (grps || []).map(g => g.id);
        const tournamentMatches = (mtchs || []).filter(m => groupIds.includes(m.group_id));
        setMatches(tournamentMatches);

        // Fetch Qualifications
        const { data: quals } = await supabase
            .from('qualifications')
            .select('*, teams(name)')
            .eq('tournament_id', id);
        setQualifications(quals || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    // Generate Groups Logic
    const handleGenerateGroups = async () => {
        if (registrations.length === 0) {
            setActionMessage('No teams registered. Cannot generate groups.');
            return;
        }

        setActionMessage('Generating groups...');
        const GROUP_SIZE = 12;
        const stageName = tournament.current_stage || tournament.stages?.[0] || 'Qualifiers';

        // Shuffle teams (Fisher-Yates)
        const teamIds = registrations.map(r => r.team_id);
        for (let i = teamIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]];
        }

        // Split into chunks of 12
        const chunks = [];
        for (let i = 0; i < teamIds.length; i += GROUP_SIZE) {
            chunks.push(teamIds.slice(i, i + GROUP_SIZE));
        }

        try {
            // Delete existing groups for this tournament (reset)
            await supabase.from('groups').delete().eq('tournament_id', id);

            const createdGroups = [];

            // Create new groups
            for (let i = 0; i < chunks.length; i++) {
                const groupName = chunks[i].length < GROUP_SIZE ? 'Wildcard' : `Group ${String.fromCharCode(65 + i)}`;

                // Insert group
                const { data: newGroup, error: gError } = await supabase
                    .from('groups')
                    .insert({ tournament_id: id, stage_name: stageName, name: groupName })
                    .select()
                    .single();

                if (gError) throw gError;
                createdGroups.push(newGroup);

                // Insert group_teams
                const groupTeams = chunks[i].map(teamId => ({
                    group_id: newGroup.id,
                    team_id: teamId
                }));

                const { error: gtError } = await supabase.from('group_teams').insert(groupTeams);
                if (gtError) throw gtError;
            }

            // Discord Automation
            // if (tournament.discord_category_id) { ... } // Replaced by Bot
            setActionMessage(`Successfully created ${chunks.length} groups! (Discord Bot will handle channels)`);

            fetchData(); // Refresh
        } catch (err) {
            console.error(err);
            setActionMessage(`Error: ${err.message}`);
        }
    };

    // Schedule Match
    const handleScheduleMatch = async (e) => {
        e.preventDefault();
        if (!selectedGroup) {
            setActionMessage('Please select a group first.');
            return;
        }

        try {
            const { error } = await supabase.from('matches').insert({
                group_id: selectedGroup,
                start_time: matchForm.start_time,
                room_id: matchForm.room_id,
                room_password: matchForm.room_password,
                status: 'scheduled',
                match_number: matches.filter(m => m.group_id === selectedGroup).length + 1
            });

            if (error) throw error;

            // Also insert into match_credentials
            const { data: newMatch } = await supabase
                .from('matches')
                .select('id')
                .eq('group_id', selectedGroup)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (newMatch) {
                await supabase.from('match_credentials').upsert({
                    match_id: newMatch.id,
                    room_id: matchForm.room_id,
                    room_password: matchForm.room_password
                });
            }

            setActionMessage('Match scheduled successfully!');
            setMatchForm({ start_time: '', room_id: '', room_password: '' });
            setSelectedGroup(null);
            fetchData();
        } catch (err) {
            setActionMessage(`Error: ${err.message}`);
        }
    };

    // Update Match Status
    const handleUpdateMatchStatus = async (matchId, newStatus) => {
        try {
            const { error } = await supabase
                .from('matches')
                .update({ status: newStatus })
                .eq('id', matchId);

            if (error) throw error;

            setActionMessage(`Match marked as ${newStatus}`);
            fetchData();
        } catch (err) {
            setActionMessage(`Error: ${err.message}`);
        }
    };

    // Load results form for a match
    const handleLoadResultsForm = (match) => {
        setSelectedMatch(match);
        // Get teams from the match's group
        const group = groups.find(g => g.id === match.group_id);
        if (group && group.group_teams) {
            const teamsData = group.group_teams.map(gt => ({
                team_id: gt.teams.id,
                team_name: gt.teams.name,
                placement: '',
                kills: 0,
                points: 0,
                qualify: false
            }));
            setResultsForm(teamsData);
        }
    };

    // Save Results
    const handleSaveResults = async () => {
        if (!selectedMatch) return;

        try {
            // Insert/update results
            for (const result of resultsForm) {
                const { error } = await supabase.from('match_results').upsert({
                    match_id: selectedMatch.id,
                    team_id: result.team_id,
                    placement: result.placement || null,
                    kills: result.kills || 0,
                    points: result.points || 0
                }, { onConflict: 'match_id,team_id' });

                if (error) throw error;
            }

            setActionMessage('Results saved successfully!');
            setSelectedMatch(null);
            setResultsForm([]);
            fetchData();
        } catch (err) {
            setActionMessage(`Error: ${err.message}`);
        }
    };

    // Qualify Teams
    const handleQualifyTeams = async () => {
        const teamsToQualify = resultsForm.filter(r => r.qualify);
        if (teamsToQualify.length === 0) {
            setActionMessage('No teams selected for qualification.');
            return;
        }

        const currentStageIndex = tournament.stages?.indexOf(tournament.current_stage) || 0;
        const nextStage = tournament.stages?.[currentStageIndex + 1];

        if (!nextStage) {
            setActionMessage('This is the final stage. No further qualification possible.');
            return;
        }

        try {
            for (const team of teamsToQualify) {
                const { error } = await supabase.from('qualifications').upsert({
                    tournament_id: id,
                    team_id: team.team_id,
                    from_stage: tournament.current_stage,
                    to_stage: nextStage,
                    stage_number: currentStageIndex + 1
                }, { onConflict: 'tournament_id,team_id,from_stage' });

                if (error) throw error;
            }

            setActionMessage(`${teamsToQualify.length} teams qualified to ${nextStage}!`);
            setSelectedMatch(null);
            setResultsForm([]);
            fetchData();
        } catch (err) {
            setActionMessage(`Error: ${err.message}`);
        }
    };

    // Advance to Next Stage
    const handleAdvanceStage = async () => {
        const currentStageIndex = tournament.stages?.indexOf(tournament.current_stage) || 0;
        const nextStage = tournament.stages?.[currentStageIndex + 1];

        if (!nextStage) {
            setActionMessage('Tournament is already at the final stage!');
            return;
        }

        setConfirmModal({
            show: true,
            type: 'advance',
            data: { nextStage }
        });
    };

    const confirmAdvanceStage = async () => {
        const { nextStage } = confirmModal.data;
        setConfirmModal({ show: false, type: '', data: null });

        try {
            // Update tournament current_stage
            const { error } = await supabase
                .from('tournaments')
                .update({ current_stage: nextStage })
                .eq('id', id);

            if (error) throw error;

            setActionMessage(`Tournament advanced to ${nextStage}!`);
            fetchData();
        } catch (err) {
            setActionMessage(`Error: ${err.message}`);
        }
    };

    // Disqualify Team
    const handleDisqualify = async (registrationId, teamName) => {
        setConfirmModal({ show: true, type: 'disqualify', data: { registrationId, teamName } });
    };

    const confirmDisqualify = async () => {
        const { registrationId } = confirmModal.data;
        setConfirmModal({ show: false, type: '', data: null });

        try {
            await supabase.from('tournament_registrations').delete().eq('id', registrationId);
            setActionMessage('Team disqualified successfully.');
            fetchData();
        } catch (err) {
            setActionMessage(`Error: ${err.message}`);
        }
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return '#60a5fa';
            case 'live': return '#34d399';
            case 'completed': return '#888';
            default: return '#666';
        }
    };

    if (loading) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Loading details...</div>;
    if (!tournament) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Tournament not found.</div>;

    const tabStyle = (isActive) => ({
        padding: '12px 24px',
        background: isActive ? '#34d399' : 'transparent',
        border: isActive ? 'none' : '1px solid #333',
        borderRadius: '8px',
        color: isActive ? '#000' : '#888',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '0.9rem'
    });

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff', paddingBottom: '80px' }}>
            {/* Confirm Modal */}
            {confirmModal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                            {confirmModal.type === 'advance' ? '🚀' : '⚠️'}
                        </div>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '12px', color: '#fff' }}>
                            {confirmModal.type === 'advance' ? 'Advance Tournament Stage' : 'Confirm Disqualification'}
                        </h3>
                        <p style={{ color: '#888', marginBottom: '24px' }}>
                            {confirmModal.type === 'advance'
                                ? `Move to ${confirmModal.data?.nextStage}? This will allow you to re-generate groups for qualified teams.`
                                : `Remove ${confirmModal.data?.teamName} from this tournament?`
                            }
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => setConfirmModal({ show: false, type: '', data: null })} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #444', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                            <button
                                onClick={confirmModal.type === 'advance' ? confirmAdvanceStage : confirmDisqualify}
                                style={{ padding: '12px 24px', background: confirmModal.type === 'advance' ? '#34d399' : '#ef4444', border: 'none', borderRadius: '8px', color: confirmModal.type === 'advance' ? '#000' : '#fff', cursor: 'pointer', fontWeight: '600' }}
                            >
                                {confirmModal.type === 'advance' ? 'Advance' : 'Disqualify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '32px' }}>
                <Link href="/admin/super/tournaments" style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(10, 10, 10, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '100px', color: '#fff', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' }}>← Back</div>
                </Link>
            </div>

            {/* Action Message */}
            {actionMessage && (
                <div style={{ padding: '16px', marginBottom: '24px', borderRadius: '8px', background: actionMessage.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)', color: actionMessage.includes('Error') ? '#ef4444' : '#34d399', fontWeight: '500' }}>
                    {actionMessage}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '12px', lineHeight: '1.1' }}>{tournament.name}</h1>
                    <div style={{ display: 'flex', gap: '16px', color: '#aaa', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%' }}></span>
                            {tournament.game}
                        </span>
                        <span style={{ background: '#333', width: '1px', height: '16px' }}></span>
                        <span>Max {tournament.max_teams} Teams</span>
                        <span style={{ background: '#333', width: '1px', height: '16px' }}></span>
                        <span style={{ color: '#34d399' }}>{tournament.prize} Prize Pool</span>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ padding: '6px 12px', background: '#4f46e5', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '600' }}>
                            Current Stage: {tournament.current_stage || 'Qualifiers'}
                        </span>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>
                            {qualifications.length} teams qualified
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleGenerateGroups} style={{ padding: '12px 24px', background: '#34d399', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                        Generate Groups
                    </button>
                    <button onClick={handleAdvanceStage} style={{ padding: '12px 24px', background: '#4f46e5', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                        Advance Stage →
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab('groups')} style={tabStyle(activeTab === 'groups')}>Groups</button>
                <button onClick={() => setActiveTab('matches')} style={tabStyle(activeTab === 'matches')}>Match Schedule</button>
                <button onClick={() => setActiveTab('results')} style={tabStyle(activeTab === 'results')}>Results & Qualify</button>
                <button onClick={() => setActiveTab('teams')} style={tabStyle(activeTab === 'teams')}>Registered Teams</button>
            </div>

            {/* GROUPS TAB */}
            {activeTab === 'groups' && (
                <div>
                    {groups.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', background: '#1a1a1a', borderRadius: '16px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '16px', opacity: 0.3 }}>🎲</div>
                            <p style={{ color: '#888' }}>No groups generated yet. Click "Generate Groups" to create groups.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            {groups.map(g => (
                                <div key={g.id} style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', color: g.name === 'Wildcard' ? '#f59e0b' : '#fff' }}>{g.name}</h4>
                                        <span style={{ fontSize: '0.8rem', color: '#666', background: '#222', padding: '4px 8px', borderRadius: '4px' }}>{g.group_teams?.length || 0} Teams</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {g.group_teams?.map(gt => {
                                            const isQualified = qualifications.some(q => q.team_id === gt.teams?.id);
                                            return (
                                                <div key={gt.id} style={{ padding: '10px 12px', background: '#111', borderRadius: '6px', fontSize: '0.9rem', color: '#ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>{gt.teams?.name || 'Unknown'}</span>
                                                    {isQualified && <span style={{ fontSize: '0.75rem', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 8px', borderRadius: '100px' }}>Qualified</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MATCHES TAB */}
            {activeTab === 'matches' && (
                <div>
                    {/* Schedule New Match Form */}
                    <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #333', padding: '24px', marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '20px', fontWeight: '600' }}>Schedule New Match</h3>
                        <form onSubmit={handleScheduleMatch}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={labelStyle}>Select Group</label>
                                    <select
                                        value={selectedGroup || ''}
                                        onChange={(e) => setSelectedGroup(parseInt(e.target.value))}
                                        style={inputStyle}
                                        required
                                    >
                                        <option value="">Choose group...</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name} ({g.group_teams?.length || 0} teams)</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Match Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={matchForm.start_time}
                                        onChange={(e) => setMatchForm({ ...matchForm, start_time: e.target.value })}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Room ID</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., ABCD1234"
                                        value={matchForm.room_id}
                                        onChange={(e) => setMatchForm({ ...matchForm, room_id: e.target.value })}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Room Password</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., SecretPass"
                                        value={matchForm.room_password}
                                        onChange={(e) => setMatchForm({ ...matchForm, room_password: e.target.value })}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" style={btnStyle}>Schedule Match</button>
                        </form>
                    </div>

                    {/* Existing Matches */}
                    <h3 style={{ marginBottom: '20px', fontWeight: '600' }}>Scheduled Matches</h3>
                    {matches.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', background: '#1a1a1a', borderRadius: '12px', color: '#888' }}>
                            No matches scheduled yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {matches.map(m => (
                                <div key={m.id} style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{m.groups?.name} - Match #{m.match_number || 1}</div>
                                        <div style={{ color: '#888', fontSize: '0.9rem' }}>
                                            {new Date(m.start_time).toLocaleString()}
                                        </div>
                                        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#666' }}>
                                            Room: <span style={{ color: '#aaa' }}>{m.room_id}</span> | Pass: <span style={{ color: '#aaa' }}>{m.room_password}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ padding: '4px 12px', background: getStatusColor(m.status) + '22', color: getStatusColor(m.status), borderRadius: '100px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize' }}>
                                            {m.status}
                                        </span>
                                        {m.status === 'scheduled' && (
                                            <button onClick={() => handleUpdateMatchStatus(m.id, 'live')} style={{ padding: '8px 16px', background: '#34d399', border: 'none', borderRadius: '6px', color: '#000', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                Start
                                            </button>
                                        )}
                                        {m.status === 'live' && (
                                            <button onClick={() => handleUpdateMatchStatus(m.id, 'completed')} style={{ padding: '8px 16px', background: '#4f46e5', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* RESULTS TAB */}
            {activeTab === 'results' && (
                <div>
                    {!selectedMatch ? (
                        <>
                            <h3 style={{ marginBottom: '20px', fontWeight: '600' }}>Select a Match to Enter Results</h3>
                            {matches.filter(m => m.status === 'completed' || m.status === 'live').length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', background: '#1a1a1a', borderRadius: '12px', color: '#888' }}>
                                    No matches available for results entry. Start or complete a match first.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {matches.filter(m => m.status === 'completed' || m.status === 'live').map(m => (
                                        <div
                                            key={m.id}
                                            onClick={() => handleLoadResultsForm(m)}
                                            style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.borderColor = '#34d399'}
                                            onMouseOut={(e) => e.currentTarget.style.borderColor = '#333'}
                                        >
                                            <div style={{ fontWeight: '600' }}>{m.groups?.name} - Match #{m.match_number || 1}</div>
                                            <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '4px' }}>
                                                {new Date(m.start_time).toLocaleString()} • Click to enter results
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #333', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontWeight: '600' }}>Results Entry</h3>
                                    <p style={{ color: '#888', fontSize: '0.9rem' }}>{selectedMatch.groups?.name} - Match #{selectedMatch.match_number || 1}</p>
                                </div>
                                <button onClick={() => { setSelectedMatch(null); setResultsForm([]); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #444', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
                                    ← Back
                                </button>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#111', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Team</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Placement</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Kills</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Points</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Qualify?</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resultsForm.map((team, idx) => (
                                            <tr key={team.team_id} style={{ borderBottom: '1px solid #222' }}>
                                                <td style={{ padding: '12px', color: '#fff', fontWeight: '500' }}>{team.team_name}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={team.placement}
                                                        onChange={(e) => {
                                                            const newForm = [...resultsForm];
                                                            newForm[idx].placement = parseInt(e.target.value) || '';
                                                            setResultsForm(newForm);
                                                        }}
                                                        style={{ ...inputStyle, width: '60px', textAlign: 'center' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={team.kills}
                                                        onChange={(e) => {
                                                            const newForm = [...resultsForm];
                                                            newForm[idx].kills = parseInt(e.target.value) || 0;
                                                            setResultsForm(newForm);
                                                        }}
                                                        style={{ ...inputStyle, width: '60px', textAlign: 'center' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={team.points}
                                                        onChange={(e) => {
                                                            const newForm = [...resultsForm];
                                                            newForm[idx].points = parseInt(e.target.value) || 0;
                                                            setResultsForm(newForm);
                                                        }}
                                                        style={{ ...inputStyle, width: '60px', textAlign: 'center' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={team.qualify}
                                                        onChange={(e) => {
                                                            const newForm = [...resultsForm];
                                                            newForm[idx].qualify = e.target.checked;
                                                            setResultsForm(newForm);
                                                        }}
                                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button onClick={handleSaveResults} style={{ ...btnStyle, background: '#34d399' }}>
                                    Save Results
                                </button>
                                <button onClick={handleQualifyTeams} style={{ ...btnStyle, background: '#4f46e5', color: '#fff' }}>
                                    Qualify Selected Teams →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TEAMS TAB */}
            {activeTab === 'teams' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Registered Teams</h3>
                        <span style={{ padding: '6px 14px', background: '#222', borderRadius: '100px', fontSize: '0.9rem', color: registrations.length >= tournament.max_teams ? '#ef4444' : '#888' }}>
                            {registrations.length} / {tournament.max_teams} Registered
                        </span>
                    </div>

                    <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #333', overflow: 'hidden' }}>
                        {registrations.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '16px', opacity: 0.3 }}>📋</div>
                                No teams have registered for this tournament yet.
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                    <thead style={{ background: '#111', color: '#666', fontSize: '0.8rem', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <tr>
                                            <th style={{ padding: '20px 24px', fontWeight: '600' }}>Team Name</th>
                                            <th style={{ padding: '20px 24px', fontWeight: '600' }}>Join Code</th>
                                            <th style={{ padding: '20px 24px', fontWeight: '600' }}>Registered At</th>
                                            <th style={{ padding: '20px 24px', fontWeight: '600' }}>Status</th>
                                            <th style={{ padding: '20px 24px', fontWeight: '600' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map(r => {
                                            const isQualified = qualifications.some(q => q.team_id === r.team_id);
                                            return (
                                                <tr key={r.id} style={{ borderBottom: '1px solid #222' }}>
                                                    <td style={{ padding: '20px 24px', fontWeight: '600', color: '#fff' }}>
                                                        {r.teams?.name || 'Unknown Team'}
                                                    </td>
                                                    <td style={{ padding: '20px 24px', color: '#aaa', fontFamily: 'monospace' }}>
                                                        {r.teams?.join_code || '-'}
                                                    </td>
                                                    <td style={{ padding: '20px 24px', color: '#888' }}>
                                                        {new Date(r.registered_at).toLocaleDateString()} <span style={{ fontSize: '0.8em', opacity: 0.6 }}>{new Date(r.registered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </td>
                                                    <td style={{ padding: '20px 24px' }}>
                                                        <span style={{ padding: '4px 10px', background: isQualified ? 'rgba(79, 70, 229, 0.1)' : 'rgba(52, 211, 153, 0.1)', color: isQualified ? '#818cf8' : '#34d399', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '500' }}>
                                                            {isQualified ? 'Qualified' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '20px 24px' }}>
                                                        <button onClick={() => handleDisqualify(r.id, r.teams?.name)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>Disqualify</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '8px', fontWeight: '500' };
const inputStyle = { width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' };
const btnStyle = { padding: '12px 24px', background: '#34d399', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' };
