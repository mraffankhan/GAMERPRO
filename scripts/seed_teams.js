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
    } else {
        console.warn('.env.local not found at', envPath);
    }
} catch (e) {
    console.error('Error loading .env.local:', e);
}

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

async function seed() {
    await loadSql();
    console.log('Seeding fake teams...');

    // Generate 24 teams
    const teams = [];
    const adjectives = ['Crimson', 'Azure', 'Shadow', 'Neon', 'Viper', 'Thunder', 'Ghost', 'Nova', 'Cyber', 'Dark', 'Royal', 'Savage', 'Elite', 'Prime', 'Omega', 'Alpha', 'Delta', 'Echo', 'Solar', 'Lunar', 'Rapid', 'Silent', 'Golden', 'Silver'];
    const nouns = ['Dragons', 'Wolves', 'Tigers', 'Cobras', 'Eagles', 'Raiders', 'Knights', 'Assassins', 'Strikers', 'Legends', 'Warriors', 'Titans', 'Phantoms', 'Gladiators', 'Ninjas', 'Spartans', 'Hawks', 'Bears', 'Lions', 'Panthers', 'Falcons', 'Ravens', 'Sharks', 'Vipers'];

    for (let i = 0; i < 24; i++) {
        // Random combo or sequential
        const name = `${adjectives[i % adjectives.length]} ${nouns[i % nouns.length]} ${i + 1}`;
        teams.push({
            name: name,
            members_count: 4,
            join_code: `TEST${(i + 1).toString().padStart(3, '0')}`,
            logo_url: null // or a placeholder if needed
        });
    }

    try {
        // Use insert with array
        // Check if teams table exists and schema matches
        // We assume id is auto-generated
        const result = await sql`
            INSERT INTO public.teams ${sql(teams, 'name', 'members_count', 'join_code')}
            ON CONFLICT (join_code) DO NOTHING
            RETURNING id, name
        `;
        console.log(`Successfully inserted ${result.length} fake teams.`);
    } catch (err) {
        console.error('Error inserting teams:', err);
    }

    // Explicitly unref or exit
    process.exit(0);
}

seed();
