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
        setActionMessage('Generating groups...');

        const GROUP_SIZE = 12; // Or dynamic
        const stages = tournament.stages || ['Qualifiers'];
        const currentStage = tournament.current_stage || stages[0];
        const currentStageIndex = stages.indexOf(currentStage);

        let poolTeamIds = [];

        // 1. Determine Team Pool based on Stage
        if (currentStageIndex <= 0) {
            // First Stage: Use All Registrations
            if (registrations.length === 0) {
                setActionMessage('No teams registered. Cannot generate groups.');
                return;
            }
            poolTeamIds = registrations.map(r => r.team_id);
        } else {
            // Later Stage: Use Qualified Teams targeting this stage
            // We look for qualifications where to_stage === currentStage
            const { data: qualifiedTeams, error: qError } = await supabase
                .from('qualifications')
                .select('team_id')
                .eq('tournament_id', id)
                .eq('to_stage', currentStage);

            if (qError || !qualifiedTeams || qualifiedTeams.length === 0) {
                setActionMessage(`No teams qualified for ${currentStage} yet.`);
                return;
            }
            poolTeamIds = qualifiedTeams.map(q => q.team_id);
        }

        setActionMessage(`Found ${poolTeamIds.length} teams for ${currentStage}. Shuffling...`);

        // 2. Shuffle teams (Fisher-Yates)
        const teamIds = [...poolTeamIds];
        for (let i = teamIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]];
        }

        // 3. Split into chunks
        const chunks = [];
        for (let i = 0; i < teamIds.length; i += GROUP_SIZE) {
            chunks.push(teamIds.slice(i, i + GROUP_SIZE));
        }

        try {
            // Delete existing groups for THIS stage only (safety)
            await supabase.from('groups').delete().eq('tournament_id', id).eq('stage_name', currentStage);

            const createdGroups = [];

            // 4. Create new groups
            for (let i = 0; i < chunks.length; i++) {
                // Name: "Quarter Group A" or "Qualifiers Group B"
                const groupLetter = String.fromCharCode(65 + i);
                const groupName = `${currentStage} Group ${groupLetter}`;

                // Insert group
                const { data: newGroup, error: gError } = await supabase
                    .from('groups')
                    .insert({ tournament_id: id, stage_name: currentStage, name: groupName })
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

            // Msg
            setActionMessage(`Successfully created ${chunks.length} groups for ${currentStage}! (Discord Bot will handle channels)`);

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
                team_id: gt.teams?.id,
                team_name: gt.teams?.name || 'Unknown Team',
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

    // Premium UI Styles
    const styles = {
        container: { maxWidth: '1200px', margin: '0 auto', color: '#fff', paddingBottom: '100px', fontFamily: "'Inter', sans-serif" },
        glassPanel: { background: 'rgba(20, 20, 20, 0.6)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' },
        headerBadge: { padding: '6px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' },
        tabBtn: (isActive) => ({
            padding: '14px 28px',
            background: isActive ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' : 'rgba(255,255,255,0.03)',
            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: isActive ? '#000' : '#888',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
            boxShadow: isActive ? '0 4px 12px rgba(52, 211, 153, 0.3)' : 'none'
        }),
        primaryBtn: { padding: '14px 28px', background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: '700', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)', transition: 'transform 0.2s' },
        secondaryBtn: { padding: '14px 28px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' },
        dangerBtn: { padding: '14px 28px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' },
        input: { width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' },
        label: { display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '8px', fontWeight: '500' }
    };

    return (
        <div style={styles.container}>
            {/* Confirm Modal */}
            {confirmModal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ ...styles.glassPanel, padding: '40px', maxWidth: '450px', width: '90%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '24px' }}>
                            {confirmModal.type === 'advance' ? '🚀' : '⚠️'}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', fontWeight: '700' }}>
                            {confirmModal.type === 'advance' ? 'Advance Criteria' : 'Confirm Action'}
                        </h3>
                        <p style={{ color: '#aaa', marginBottom: '32px', lineHeight: '1.6' }}>
                            {confirmModal.type === 'advance'
                                ? `Are you sure you want to move to **${confirmModal.data?.nextStage}**? This enables group generation for qualified teams.`
                                : `Permanently remove **${confirmModal.data?.teamName}** from the tournament?`
                            }
                        </p>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <button onClick={() => setConfirmModal({ show: false, type: '', data: null })} style={styles.secondaryBtn}>Cancel</button>
                            <button
                                onClick={confirmModal.type === 'advance' ? confirmAdvanceStage : confirmDisqualify}
                                style={confirmModal.type === 'advance' ? styles.primaryBtn : styles.dangerBtn}
                            >
                                {confirmModal.type === 'advance' ? 'Confirm Advance' : 'Disqualify Team'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Breadcrumb */}
            <div style={{ marginBottom: '40px' }}>
                <Link href="/admin/super/tournaments" style={{ textDecoration: 'none' }}>
                    <div style={{ ...styles.secondaryBtn, display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '100px', padding: '10px 24px', fontSize: '0.9rem' }}>
                        <span>←</span> Back to Dashboard
                    </div>
                </Link>
            </div>

            {/* Action Message */}
            {actionMessage && (
                <div style={{
                    padding: '20px', marginBottom: '32px', borderRadius: '16px',
                    background: actionMessage.includes('Error') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                    border: `1px solid ${actionMessage.includes('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                    color: actionMessage.includes('Error') ? '#fca5a5' : '#6ee7b7',
                    fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>{actionMessage.includes('Error') ? '❌' : '✅'}</span>
                    {actionMessage}
                </div>
            )}

            {/* Hero Header */}
            <div style={{ ...styles.glassPanel, padding: '40px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '32px' }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-1px', background: 'linear-gradient(to right, #fff, #ccc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{tournament.name}</h1>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
                        <span style={{ ...styles.headerBadge, background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                            🎮 {tournament.game}
                        </span>
                        <span style={{ ...styles.headerBadge, background: 'rgba(255, 255, 255, 0.1)', color: '#ccc' }}>
                            👥 Max {tournament.max_teams} Teams
                        </span>
                        <span style={{ ...styles.headerBadge, background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#000', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)' }}>
                            🏆 {tournament.prize}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px 16px', background: '#3b82f6', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            STAGE: {tournament.current_stage || 'Qualifiers'}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.9rem' }}>
                            {qualifications.length} teams qualified to next round
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                    <button onClick={handleGenerateGroups} style={styles.primaryBtn}>
                        Generate Groups 🎲
                    </button>
                    <button onClick={handleAdvanceStage} style={{ ...styles.secondaryBtn, background: '#4f46e5', borderColor: '#4f46e5' }}>
                        Advance Stage →
                    </button>
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                        Automated Discord Actions
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['groups', 'matches', 'results', 'teams'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={styles.tabBtn(activeTab === tab)}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT AREAS */}
            <div style={{ minHeight: '400px' }}>

                {/* GROUPS TAB */}
                {activeTab === 'groups' && (
                    <div style={{ animation: 'fadeIn 0.4s ease' }}>
                        {groups.length === 0 ? (
                            <div style={{ ...styles.glassPanel, padding: '80px', textAlign: 'center' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '24px', opacity: 0.5 }}>🎰</div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '12px' }}>No Groups Yet</h3>
                                <p style={{ color: '#888', maxWidth: '400px', margin: '0 auto 24px' }}>
                                    Generate groups to automatically create Discord channels and assign team roles.
                                </p>
                                <button onClick={handleGenerateGroups} style={styles.primaryBtn}>Generate {tournament.current_stage || 'Qualifiers'} Groups</button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                                {groups.map(g => (
                                    <div key={g.id} style={{ ...styles.glassPanel, padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                                            <h4 style={{ fontWeight: '700', fontSize: '1.25rem', color: g.name.includes('Wildcard') ? '#fbbf24' : '#fff' }}>{g.name}</h4>
                                            <span style={{ fontSize: '0.8rem', color: '#888', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '6px' }}>
                                                {g.group_teams?.length || 0} / 12
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                                            {g.group_teams?.map((gt, idx) => {
                                                const isQualified = qualifications.some(q => q.team_id === gt.teams?.id);
                                                return (
                                                    <div key={gt.id} style={{
                                                        padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                                                        border: isQualified ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid transparent',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        transition: 'background 0.2s',
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ color: '#555', fontSize: '0.8rem', width: '20px' }}>{idx + 1}</span>
                                                            <span style={{ fontWeight: '500', color: isQualified ? '#34d399' : '#ddd' }}>{gt.teams?.name || 'Unknown'}</span>
                                                        </div>
                                                        {isQualified && <span style={{ fontSize: '0.7rem', color: '#000', background: '#34d399', padding: '2px 8px', borderRadius: '100px', fontWeight: 'bold' }}>Q</span>}
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
                    <div style={{ animation: 'fadeIn 0.4s ease', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px', alignItems: 'start' }}>
                        {/* Scheduler Column */}
                        <div style={{ ...styles.glassPanel, padding: '32px' }}>
                            <h3 style={{ marginBottom: '24px', fontWeight: '700', fontSize: '1.2rem' }}>🗓️ Schedule Match</h3>
                            <form onSubmit={handleScheduleMatch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={styles.label}>Target Group</label>
                                    <select
                                        value={selectedGroup || ''}
                                        onChange={(e) => setSelectedGroup(parseInt(e.target.value))}
                                        style={styles.input}
                                        required
                                    >
                                        <option value="">Select a group...</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.label}>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={matchForm.start_time}
                                        onChange={(e) => setMatchForm({ ...matchForm, start_time: e.target.value })}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>Room ID</label>
                                    <input
                                        type="text"
                                        placeholder="0000 0000"
                                        value={matchForm.room_id}
                                        onChange={(e) => setMatchForm({ ...matchForm, room_id: e.target.value })}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>Password</label>
                                    <input
                                        type="text"
                                        placeholder="Secret"
                                        value={matchForm.room_password}
                                        onChange={(e) => setMatchForm({ ...matchForm, room_password: e.target.value })}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                                <button type="submit" style={{ ...styles.primaryBtn, width: '100%', marginTop: '8px' }}>
                                    Publish Schedule
                                </button>
                                <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', margin: 0 }}>
                                    Bot will notify players instantly.
                                </p>
                            </form>
                        </div>

                        {/* List Column */}
                        <div>
                            <h3 style={{ marginBottom: '24px', fontWeight: '700', fontSize: '1.5rem' }}>Upcoming Matches</h3>
                            {matches.length === 0 ? (
                                <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed #333', borderRadius: '16px' }}>
                                    No matches scheduled.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {matches.map(m => (
                                        <div key={m.id} style={{ ...styles.glassPanel, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                                    ⚔️
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>{m.groups?.name}</div>
                                                    <div style={{ color: '#aaa', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span>Match #{m.match_number || 1}</span>
                                                        <span>•</span>
                                                        <span>{new Date(m.start_time).toLocaleString()}</span>
                                                    </div>
                                                    <div style={{ marginTop: '8px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontFamily: 'monospace', color: '#fae8b9' }}>
                                                        ID: {m.room_id} | PW: {m.room_password}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', background: getStatusColor(m.status), color: '#000' }}>
                                                    {m.status}
                                                </span>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {m.status === 'scheduled' && (
                                                        <button onClick={() => handleUpdateMatchStatus(m.id, 'live')} style={{ padding: '8px 16px', background: '#34d399', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>Start</button>
                                                    )}
                                                    {m.status === 'live' && (
                                                        <button onClick={() => handleUpdateMatchStatus(m.id, 'completed')} style={{ padding: '8px 16px', background: '#4f46e5', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>Finish</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* RESULTS TAB */}
                {activeTab === 'results' && (
                    <div style={{ animation: 'fadeIn 0.4s ease' }}>
                        {!selectedMatch ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                                {matches.filter(m => m.status === 'completed' || m.status === 'live').length === 0 ? (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                                        Start or complete matches to enter results.
                                    </div>
                                ) : (
                                    matches.filter(m => m.status === 'completed' || m.status === 'live').map(m => (
                                        <div key={m.id} onClick={() => handleLoadResultsForm(m)} style={{ ...styles.glassPanel, padding: '24px', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(52, 211, 153, 0.2)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                <span style={{ fontSize: '2rem' }}>📊</span>
                                                <span style={{ padding: '4px 12px', background: '#34d399', color: '#000', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 'bold', height: 'fit-content' }}>READY</span>
                                            </div>
                                            <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{m.groups?.name}</h4>
                                            <p style={{ color: '#aaa', marginTop: '4px', fontSize: '0.9rem' }}>Match #{m.match_number}</p>
                                            <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#34d399', fontWeight: '600' }}>Enter Results →</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div style={{ ...styles.glassPanel, padding: '40px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Result Entry</div>
                                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{selectedMatch.groups?.name} <span style={{ color: '#666' }}>Match #{selectedMatch.match_number}</span></h2>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => { setSelectedMatch(null); setResultsForm([]); }} style={styles.secondaryBtn}>Cancel</button>
                                        <button onClick={handleSaveResults} style={styles.primaryBtn}>Save & Post Leaderboard</button>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <tr style={{ color: '#bbb', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                                                <th style={{ padding: '16px', textAlign: 'left' }}>Team Name</th>
                                                <th style={{ padding: '16px', textAlign: 'center', width: '120px' }}>Rank #</th>
                                                <th style={{ padding: '16px', textAlign: 'center', width: '120px' }}>Kills</th>
                                                <th style={{ padding: '16px', textAlign: 'center', width: '120px' }}>Total Pts</th>
                                                <th style={{ padding: '16px', textAlign: 'center', width: '100px' }}>Qualify</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resultsForm.map((team, idx) => (
                                                <tr key={team.team_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '16px', fontWeight: '600' }}>{team.team_name}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <input
                                                            type="number"
                                                            value={team.placement}
                                                            onChange={(e) => {
                                                                const newForm = [...resultsForm];
                                                                newForm[idx].placement = parseInt(e.target.value) || '';
                                                                setResultsForm(newForm);
                                                            }}
                                                            style={{ ...styles.input, textAlign: 'center', padding: '8px' }}
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <input
                                                            type="number"
                                                            value={team.kills}
                                                            onChange={(e) => {
                                                                const newForm = [...resultsForm];
                                                                newForm[idx].kills = parseInt(e.target.value) || 0;
                                                                setResultsForm(newForm);
                                                            }}
                                                            style={{ ...styles.input, textAlign: 'center', padding: '8px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <input
                                                            type="number"
                                                            value={team.points}
                                                            onChange={(e) => {
                                                                const newForm = [...resultsForm];
                                                                newForm[idx].points = parseInt(e.target.value) || 0;
                                                                setResultsForm(newForm);
                                                            }}
                                                            style={{ ...styles.input, textAlign: 'center', padding: '8px', color: '#fbbf24', fontWeight: 'bold' }}
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
                                                            style={{ width: '24px', height: '24px', accentColor: '#4f46e5', cursor: 'pointer' }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                    <button onClick={handleQualifyTeams} style={{ ...styles.primaryBtn, background: '#4f46e5', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)' }}>
                                        Confirm Qualification →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TEAMS TAB */}
                {activeTab === 'teams' && (
                    <div style={{ ...styles.glassPanel, padding: '0', overflow: 'hidden', animation: 'fadeIn 0.4s ease' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Registry</h3>
                            <span style={{ fontSize: '0.9rem', color: '#888' }}>{registrations.length} Teams</span>
                        </div>
                        {registrations.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>Empty Registry</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                                    <tr style={{ textAlign: 'left', color: '#888', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                        <th style={{ padding: '20px 24px' }}>Team</th>
                                        <th style={{ padding: '20px 24px' }}>Code</th>
                                        <th style={{ padding: '20px 24px' }}>Date</th>
                                        <th style={{ padding: '20px 24px' }}>Status</th>
                                        <th style={{ padding: '20px 24px', textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map(r => {
                                        const isQualified = qualifications.some(q => q.team_id === r.team_id);
                                        return (
                                            <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '20px 24px', fontWeight: '600' }}>{r.teams?.name}</td>
                                                <td style={{ padding: '20px 24px', fontFamily: 'monospace', color: '#aaa' }}>{r.teams?.join_code}</td>
                                                <td style={{ padding: '20px 24px', color: '#888' }}>{new Date(r.registered_at).toLocaleDateString()}</td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 'bold', background: isQualified ? 'rgba(79, 70, 229, 0.2)' : 'rgba(52, 211, 153, 0.1)', color: isQualified ? '#818cf8' : '#34d399' }}>
                                                        {isQualified ? 'QUALIFIED' : 'ACTIVE'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                                    <button onClick={() => handleDisqualify(r.id, r.teams?.name)} style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.8 }}>
                                                        Disqualify
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
