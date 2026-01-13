import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=');
                process.env[key.trim()] = value.trim();
            }
        });
    }
} catch (e) { console.error('Error loading .env.local:', e); }

// Dynamic import
let sql;
async function loadSql() {
    try {
        const module = await import('../src/lib/supabase.js');
        sql = module.default;
    } catch (e) {
        console.error('Error importing supabase.js', e);
        process.exit(1);
    }
}

async function seedRegistrations() {
    await loadSql();
    console.log('Registering fake teams to tournaments...');

    try {
        // 1. Fetch fake teams (join_code starts with 'TEST' or created by seed)
        // Or just fetch all teams that have members_count = 4 and look like fake teams
        const teams = await sql`SELECT id, name FROM public.teams WHERE join_code LIKE 'TEST%'`;

        if (teams.length === 0) {
            console.log('No fake teams found. Run seed_teams.js first.');
            process.exit(0);
        }

        // 2. Fetch active tournaments
        const tournaments = await sql`SELECT id, name, max_teams FROM public.tournaments`;

        if (tournaments.length === 0) {
            console.log('No tournaments found.');
            process.exit(0);
        }

        console.log(`Found ${teams.length} teams and ${tournaments.length} tournaments.`);

        let totalRegistrations = 0;

        for (const t of tournaments) {
            // Register teams up to max_teams or as many as available
            const limit = t.max_teams || 12; // Default 12 if null
            // Shuffle teams or just take first N
            const teamsToRegister = teams.slice(0, limit);

            // Prepare registrations
            const registrations = teamsToRegister.map(team => ({
                tournament_id: t.id,
                team_id: team.id
            }));

            if (registrations.length > 0) {
                const res = await sql`
                    INSERT INTO public.tournament_registrations ${sql(registrations, 'tournament_id', 'team_id')}
                    ON CONFLICT (tournament_id, team_id) DO NOTHING
                    RETURNING id
                `;
                console.log(`Registered ${res.length} teams to '${t.name}'`);
                totalRegistrations += res.length;
            }
        }

        console.log(`Total new registrations: ${totalRegistrations}`);

    } catch (err) {
        console.error('Error seeding registrations:', err);
    }

    process.exit(0);
}

seedRegistrations();
