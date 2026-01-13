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

async function migrate() {
    await loadSql();
    console.log('Running Groups & Matches Migration...');

    const migrationPath = path.resolve(__dirname, '../migration_groups_matches.sql');

    try {
        // Read file content manually to ensure we handle it correctly if postgres.file() has issues in this env
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        // Execute raw SQL
        // Note: postgres.js might need 'unsafe' for raw strings if we don't use the template tag correctly
        // But sql(string) assumes parameters. 
        // sql.unsafe(string) is usually the way for raw SQL scripts.

        await sql.unsafe(migrationSql);

        console.log('Migration applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
