"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Leaf, Map, Activity, Zap, ArrowUpRight, Wind, Volume2, CloudRain, Car, BarChart3, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";


import { Globe } from "@/components/ui/globe";
import { Highlighter } from "@/components/ui/highlighter";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { Iphone } from "@/components/ui/iphone";
import { BorderBeam } from "@/components/ui/border-beam";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { ScrollVelocityContainer, ScrollVelocityRow } from "@/components/ui/scroll-based-velocity";
import { Lens } from "@/components/ui/lens";
import { PulsatingButton } from "@/components/ui/pulsating-button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Marquee } from "@/components/ui/marquee";

import { ClipPathLinks } from "@/components/interactive/clip-path-links";
import { CommunityPoll } from "@/components/interactive/community-poll";
import { GreenChecklist } from "@/components/interactive/green-checklist";


const Hero = () => {

    const { user } = useAuth();
    return (
    <section className="relative min-h-[100vh] w-full flex flex-col items-center pt-20 sm:pt-32 px-4 pb-20 overflow-hidden">
      <div className="absolute inset-x-0 top-40 h-[100vh] z-0 opacity-40 pointer-events-none">
        <Globe />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--background))]/60 to-[hsl(var(--background))] z-0" />

      <nav className="fixed top-4 sm:top-6 inset-x-4 sm:inset-x-0 mx-auto max-w-5xl h-14 sm:h-16 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-md z-50 flex justify-between items-center px-4 sm:px-6 shadow-2xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[hsl(var(--primary))]" />
          <span className="text-lg sm:text-xl font-bold font-space tracking-tight text-[hsl(var(--foreground))]">
            UrbanPulse
          </span>
        </Link>
        <div className="flex gap-2 sm:gap-4 items-center">
          {user ? (
            <Link href="/dashboard" className="hidden md:block text-sm font-medium hover:text-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))]">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="hidden md:block text-sm font-medium hover:text-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))]">
              Login
            </Link>
          )}
          <AnimatedThemeToggler className="text-[hsl(var(--foreground))]" />
          <Link href="/signup">
            <button className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold hover:bg-[hsl(var(--primary))] transition-colors">
              Get App
            </button>
          </Link>
        </div>
      </nav>

      <div className="z-10 max-w-5xl text-center space-y-6 sm:space-y-8 mt-16 sm:mt-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >

        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold font-space tracking-tighter leading-[0.9] text-[hsl(var(--foreground))]"
        >
          The <Highlighter color="hsl(var(--primary))">Pulse</Highlighter> of<br />
          Your City.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-base sm:text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto font-light px-4"
        >
          Decode urban chaos with AI. We correlate real-time traffic data with environmental metrics to build the breathable cities of tomorrow.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-6 sm:pt-8 pointer-events-auto px-4"
        >
           <Link href="/signup" className="w-full sm:w-auto">
            <InteractiveHoverButton className="bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-black w-full">
              Start Simulation
            </InteractiveHoverButton>
          </Link>
          <button className="px-8 py-3 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card))] transition-colors font-medium">
            Read Documentation
          </button>
        </motion.div>
      </div>

      <div className="absolute inset-0 pointer-events-none hidden lg:block max-w-7xl mx-auto">
        <FloatingCard icon={<Wind />} title="AQI Index" value="42 (Good)" color="bg-green-500 text-white" className="top-[30%] left-0" delay={0}/>
        <FloatingCard icon={<Car />} title="Live Traffic" value="High Congestion" color="bg-red-500 text-white" className="top-[60%] right-0" delay={1}/>
        <FloatingCard icon={<Volume2 />} title="Noise Level" value="65dB (Moderate)" color="bg-yellow-500 text-black" className="top-[25%] right-10" delay={2}/>
        <FloatingCard icon={<CloudRain />} title="Precipitation" value="12mm/h" color="bg-blue-500 text-white" className="top-[65%] left-10" delay={3}/>
      </div>
    </section>
    );
};
const FloatingCard = ({ icon, title, value, color, className, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ opacity: { delay: 0.5 + (delay * 0.2), duration: 0.5 }, y: { repeat: Infinity, duration: 3, ease: "easeInOut", delay: delay }}}
    className={`absolute p-4 rounded-3xl bg-[hsl(var(--card))]/40 backdrop-blur-xl border border-[hsl(var(--border))] shadow-2xl flex items-center gap-4 w-64 ${className}`}
  >
    <div className={`p-3 rounded-full ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-bold">{title}</p>
      <p className="text-lg font-bold text-[hsl(var(--foreground))]">{value}</p>
    </div>
  </motion.div>
);
// --- END HERO ---

// --- STATS ---
const Stats = () => (
  <section className="py-12 bg-[hsl(var(--background))] border-y border-[hsl(var(--border))]">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard number="2.4M" label="Data Points" />
        <StatCard number="15+" label="Cities Live" />
        <StatCard number="40%" label="Emission Reduction" />
        <StatCard number="12k" label="Active Users" />
      </div>
    </div>
  </section>
);
const StatCard = ({ number, label }: { number: string, label: string }) => (
  <div className="flex flex-col items-center justify-center p-8 rounded-[32px] bg-[hsl(var(--card))]/50 text-[hsl(var(--foreground))] hover:scale-[1.02] transition-transform duration-300 border border-transparent hover:border-[hsl(var(--primary))]/20">
    <h3 className="text-4xl md:text-5xl font-bold font-space tracking-tight">{number}</h3>
    <p className="text-[hsl(var(--muted-foreground))] mt-2 font-medium">{label}</p>
  </div>
);

// --- DIGITAL TWIN + DRAW CIRCLE ---
const DigitalTwin = () => {
  return (
    <section className="py-16 sm:py-24 md:py-32 px-4 relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center">
        
        <div className="order-2 lg:order-1 relative h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] w-full flex items-center justify-center">
            <div className="absolute inset-0 bg-[hsl(var(--primary))]/20 blur-[120px] rounded-full scale-75" />
            <div className="relative z-10 p-4 sm:p-5 md:p-6 bg-[hsl(var(--card))]/10 backdrop-blur-lg border border-[hsl(var(--border))] rounded-[30px] sm:rounded-[40px] md:rounded-[50px]">
               <BorderBeam size={400} duration={10} colorFrom="hsl(var(--primary))" colorTo="hsl(var(--secondary))" />
               <Iphone src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=1000&auto=format&fit=crop" className="w-[240px] sm:w-[280px] md:w-[300px] lg:w-[350px]"/>
            </div>
            {/* ... floating labels ... */}
        </div>

        <div className="order-1 lg:order-2 space-y-6 sm:space-y-8">
          <div className="inline-block p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] mb-2 sm:mb-4">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          
          {/* UPDATED HEADER WITH DRAW SVG ANIMATION */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-space leading-tight text-[hsl(var(--foreground))]">
            Predict the <br />
            <span className="relative inline-block text-[hsl(var(--primary))]">
              Unpredictable.
              <svg viewBox="0 0 286 73" fill="none" className="absolute -left-2 -right-2 -top-2 bottom-0 translate-y-1 pointer-events-none">
                <motion.path
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1.25, ease: "easeInOut" }}
                  d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
                  stroke="#00E676" strokeWidth="3"
                />
              </svg>
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-[hsl(var(--muted-foreground))] leading-relaxed">
            Our <strong>Digital Twin</strong> technology creates a living replica of your city. 
            Simulate "What-if" scenarios for instant impact analysis.
          </p>
          
          <div className="flex flex-col gap-4">
             <FeatureRow title="TomTom Maps SDK" desc="High-fidelity vector rendering" />
             <FeatureRow title="Yatri AI" desc="LLM-powered urban insights" />
             <FeatureRow title="Real-time Sync" desc="Firebase backend architecture" />
          </div>
        </div>
      </div>
    </section>
  );
};
const FeatureRow = ({ title, desc }: any) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[hsl(var(--card))] transition-colors cursor-default">
    <div className="h-10 w-10 rounded-full bg-[hsl(var(--secondary))]/20 flex items-center justify-center text-[hsl(var(--secondary))]">
      <ArrowUpRight size={20} />
    </div>
    <div>
      <h4 className="font-bold text-[hsl(var(--foreground))]">{title}</h4>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{desc}</p>
    </div>
  </div>
);

// --- BENTO GRID ---
const features = [
  { Icon: Map, name: "Eco-Routing", description: "Algorithmic pathfinding prioritizing low-carbon zones.", href: "/", cta: "See Logic", className: "col-span-3 lg:col-span-1", background: <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/20 to-transparent" /> },
  { Icon: Activity, name: "Health Connect", description: "Seamless Google Health Connect integration.", href: "/", cta: "Sync Device", className: "col-span-3 lg:col-span-2", background: <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80" className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay" alt="Health" /> },
  { Icon: ShieldCheck, name: "Gamified Economy", description: "Earn $PULSE tokens on blockchain.", href: "/", cta: "View Wallet", className: "col-span-3 lg:col-span-2", background: <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(var(--secondary))]/20 to-transparent" /> },
  { Icon: Zap, name: "Community Grid", description: "Crowdsourced infrastructure reporting.", href: "/", cta: "Report Issue", className: "col-span-3 lg:col-span-1", background: <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/10 to-transparent" /> },
];
const FeatureGrid = () => (
  <section className="py-32 px-4 bg-[hsl(var(--background))]">
    <div className="max-w-7xl mx-auto">
      <div className="mb-16 md:w-1/2">
        <h2 className="text-4xl md:text-5xl font-bold font-space text-[hsl(var(--foreground))] mb-6">Intelligence in Every Layer.</h2>
      </div>
      <BentoGrid className="auto-rows-[24rem]">
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </div>
  </section>
);

// --- MARQUEE ---
const ReviewCard = ({ name, role, body }: any) => (
  <div className="mx-4 p-6 rounded-[24px] bg-[hsl(var(--card))] border border-[hsl(var(--border))] w-[350px]">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--secondary))]" />
      <div>
        <p className="font-bold text-[hsl(var(--foreground))]">{name}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{role}</p>
      </div>
    </div>
    <p className="text-sm text-[hsl(var(--foreground))]/80 leading-relaxed">{body}</p>
  </div>
);
const CommunityReviews = () => (
    <div className="py-24 overflow-hidden bg-[hsl(var(--background))] border-t border-[hsl(var(--border))]">
        <h3 className="text-center text-2xl font-space font-bold text-[hsl(var(--foreground))] mb-12">Trusted by City Planners</h3>
        <Marquee pauseOnHover className="[--duration:40s]">
            <ReviewCard name="Alex C." role="Urban Planner" body="The digital twin simulation is a game changer for traffic flow analysis." />
            <ReviewCard name="Sarah J." role="Sustainability Lead" body="Finally, a way to quantify the environmental impact of pedestrian zones." />
            <ReviewCard name="David K." role="Developer" body="The TomTom SDK integration is seamless. Smooth animations and accurate data." />
            <ReviewCard name="Priya M." role="User" body="I love earning points just for walking to work. The gamification is addictive." />
        </Marquee>
    </div>
);

// --- REWARDS + GREEN CHECKLIST ---
const RewardsSection = () => {
  const handleConfetti = () => {
    const end = Date.now() + 3 * 1000;
    const colors = ["#00E676", "#2979FF", "#ffffff"];
    const frame = () => {
      if (Date.now() > end) return;
      confetti({ particleCount: 2, angle: 60, spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 }, colors });
      confetti({ particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 }, colors });
      requestAnimationFrame(frame);
    };
    frame();
  };

  return (
    <section className="py-32 px-4 bg-[hsl(var(--background))]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
            
            {/* Left: Text & Button */}
            <div className="md:w-1/2 text-left">
                <h2 className="text-5xl md:text-7xl font-bold font-space mb-6 text-[hsl(var(--foreground))]">
                    Earn while you <span className="text-[hsl(var(--primary))]">Move.</span>
                </h2>
                <p className="text-[hsl(var(--muted-foreground))] text-xl mb-8">
                We gamify sustainability. Every step counts towards a greener planet and real rewards.
                </p>
                
                {/* INTERACTIVE COMPONENT: CHECKLIST */}
                <GreenChecklist />
                
                <div className="mt-8">
                    <PulsatingButton onClick={handleConfetti} pulseColor="hsl(var(--primary))" className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold text-xl px-10 py-5 rounded-full hover:scale-105 transition-transform shadow-xl">
                        Claim Rewards
                    </PulsatingButton>
                </div>
            </div>

            {/* Right: Image */}
            <div className="md:w-1/2 relative">
                <Lens zoomFactor={1.5} lensSize={250}>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[hsl(var(--border))] w-full">
                    <img 
                    src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80" 
                    alt="Rewards Dashboard"
                    className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    />
                </div>
                </Lens>
            </div>
        </div>
    </section>
  );
};

// --- FOOTER ---
const Footer = () => (
  <footer className="py-20 px-8 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between">
      <div className="mb-10 md:mb-0 space-y-4">
        <h3 className="text-3xl font-bold font-space text-[hsl(var(--foreground))]">UrbanPulse</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-xs">Technical Documentation Project 304.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm text-[hsl(var(--muted-foreground))]">
        <div className="flex flex-col gap-3">
            <span className="font-bold text-[hsl(var(--foreground))]">Product</span>
            <Link href="#" className="hover:text-[hsl(var(--primary))]">Docs</Link>
        </div>
        <div className="flex flex-col gap-3">
            <span className="font-bold text-[hsl(var(--foreground))]">Social</span>
            <Link href="#" className="hover:text-[hsl(var(--primary))]">GitHub</Link>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-[hsl(var(--border))] text-center md:text-left text-xs text-[hsl(var(--muted-foreground))]">
        © 2025 UrbanPulse Inc. All rights reserved.
    </div>
  </footer>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-x-hidden">
      <Hero />
      <Stats />
      {/* 2. ADDED CLIP PATH LINKS HERE */}
      <ClipPathLinks />
      <DigitalTwin />
      <FeatureGrid />
      {/* 3. ADDED COMMUNITY POLL HERE */}
      <CommunityPoll />
      <CommunityReviews />
      <RewardsSection />
      <Footer />
    </main>
  );
}
