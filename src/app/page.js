import Hero from '@/components/Hero';
import TournamentCard from '@/components/TournamentCard';
import Link from 'next/link';

// Mock data for display purposes
const featuredTournaments = [
  {
    id: 1,
    title: "Neon City Championship",
    game: "Valorant",
    prize_pool: 5000,
    start_date: "2026-02-10T18:00:00",
    teams_registered: 12,
    max_teams: 16,
    status: "OPEN"
  },
  {
    id: 2,
    title: "Cyber Showdown 2026",
    game: "League of Legends",
    prize_pool: 10000,
    start_date: "2026-02-15T20:00:00",
    teams_registered: 8,
    max_teams: 32,
    status: "UPCOMING"
  },
  {
    id: 3,
    title: "Apex Predators Cup",
    game: "Apex Legends",
    prize_pool: 2500,
    start_date: "2026-02-05T19:00:00",
    teams_registered: 60,
    max_teams: 60,
    status: "LIVE"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col gap-0 font-body">
      <Hero />

      {/* Featured Tournaments Section */}
      <section className="py-20 bg-bg-secondary relative">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2 font-heading">
                FEATURED <span className="text-neon-blue drop-shadow-lg">TOURNAMENTS</span>
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-neon-blue to-transparent" />
            </div>

            <Link href="/tournaments" className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-sm font-bold">
              View All <span className="text-neon-blue">&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Link href="/tournaments" className="btn btn-secondary w-full">
              View All Tournaments
            </Link>
          </div>
        </div>
      </section>

      {/* CTA / Featured Match Placeholder */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Elements */}
        {/* <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10" /> */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-purple/20 blur-[120px] rounded-full" />

        <div className="container relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 bg-glass border border-white/5 p-12 rounded-2xl backdrop-blur-md">
          <div className="text-left max-w-xl">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 font-heading">
              READY TO <span className="text-neon-purple drop-shadow-lg">COMPETE?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Create your team, join a bracket, and start your journey to becoming a pro.
              The arena waits for no one.
            </p>
            <Link href="/auth/register" className="btn btn-primary px-10">
              Create Account
            </Link>
          </div>

          <div className="w-full md:w-1/3 aspect-video bg-black/50 rounded-lg border border-white/10 flex items-center justify-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-neon-purple/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <span className="text-gray-500 font-mono text-sm uppercase tracking-widest">
              Live Gameplay Feed
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
