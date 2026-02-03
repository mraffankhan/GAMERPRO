import Link from 'next/link';

export default function Hero() {
    return (
        <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-[url('/hero-bg.jpg')] bg-cover bg-center">
            {/* Overlays */}
            <div className="absolute inset-0 bg-black/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-transparent to-[#050505]" />

            {/* Content */}
            <div className="relative z-10 container text-center flex flex-col items-center">
                <div className="mb-4 py-1 px-3 rounded-full border border-neon-gold/30 bg-neon-gold/10 backdrop-blur-sm">
                    <span className="text-neon-gold text-sm font-bold tracking-wider uppercase">Private Internal Beta</span>
                </div>

                <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter text-white drop-shadow-lg">
                    GAMERPRO <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple animate-glow">
                        INTERNAL
                    </span>
                </h1>

                <p className="text-lg md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                    Exclusive access for organization testing and validation.
                    Scalable competitive infrastructure for the future of esports.
                </p>

                <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
                    <Link href="/tournaments" className="btn btn-primary text-lg px-10 py-4 clip-diagonal group">
                        <span>Join Tournament</span>
                    </Link>
                    <Link href="/teams/create" className="btn btn-secondary text-lg px-10 py-4 clip-diagonal group">
                        <span>Create Team</span>
                    </Link>
                </div>

                {/* Stats / Social Proof */}
                <div className="mt-16 flex gap-8 md:gap-16 text-center border-t border-white/10 pt-8">
                    <div>
                        <div className="text-3xl font-bold text-white">500+</div>
                        <div className="text-sm text-gray-400 uppercase tracking-widest">Tournaments</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">$10k+</div>
                        <div className="text-sm text-gray-400 uppercase tracking-widest">Prize Pool</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">10k+</div>
                        <div className="text-sm text-gray-400 uppercase tracking-widest">Gamers</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
