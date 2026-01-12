import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        'Missing DATABASE_URL environment variable. Check .env.local for DATABASE_URL'
    );
}

// Direct PostgreSQL connection to Supabase database
const sql = postgres(connectionString, {
    ssl: 'require',
    // Connection pool settings
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

export default sql;
