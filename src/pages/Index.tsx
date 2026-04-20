import EmailClassifier from "@/components/EmailClassifier";
import InboxDashboard from "@/components/InboxDashboard";
import { Mail, Binary, Brain } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen grid-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-16">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 text-xs text-secondary mb-3">
            <Binary className="w-4 h-4" />
            <span className="tracking-[0.3em]">NEURAL_MAIL_DEFENSE_SYS</span>
            <span className="ml-auto px-2 py-0.5 rounded border border-primary/40 text-primary">
              ● ONLINE
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            <span className="text-foreground">SPAM</span>
            <span className="text-primary text-glow">.detect</span>
            <span className="text-muted-foreground">{"()"}</span>
          </h1>

          <p className="mt-4 text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
            Real-time email classification engine combining{" "}
            <span className="text-secondary">handcrafted text features</span> with{" "}
            <span className="text-accent">character-trigram embeddings</span> and cosine
            similarity scoring against learned spam/ham centroids.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
            <Stat icon={<Mail className="w-4 h-4" />} label="FEATURES" value="7 signals" />
            <Stat icon={<Brain className="w-4 h-4" />} label="EMBEDDING" value="64-dim hash" />
            <Stat icon={<Binary className="w-4 h-4" />} label="LATENCY" value="< 5ms" />
          </div>
        </header>

        <main className="space-y-10">
          <InboxDashboard />

          <div>
            <div className="flex items-center gap-2 text-xs text-secondary mb-3">
              <Brain className="w-4 h-4" />
              <span className="tracking-[0.3em]">MANUAL_ANALYZER</span>
            </div>
            <EmailClassifier />
          </div>
        </main>

        <footer className="mt-16 pt-6 border-t border-border text-xs text-muted-foreground flex justify-between">
          <span>// classifier_v1.0 — runs entirely client-side</span>
          <span className="text-primary">$ ready_</span>
        </footer>
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded border border-primary/20 bg-card/40 backdrop-blur px-4 py-3 flex items-center gap-3">
    <div className="text-primary">{icon}</div>
    <div>
      <div className="text-[10px] text-muted-foreground tracking-widest">{label}</div>
      <div className="text-sm text-foreground font-semibold">{value}</div>
    </div>
  </div>
);

export default Index;
