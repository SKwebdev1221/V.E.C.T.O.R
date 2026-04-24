import { useState } from "react";
import { classifyEmail, SAMPLE_EMAILS, type ClassificationResult } from "@/lib/spamClassifier";
import { saveEmail } from "@/lib/mockEmails";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Zap, Activity, Cpu } from "lucide-react";

const EmailClassifier = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const r = await classifyEmail(text);
      setResult(r);
      saveEmail(text); // Save to Inbox History
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSample = (sample: string) => {
    setText(sample);
    setResult(null);
  };

  const isSpam = result?.label === "SPAM";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Input panel */}
      <div className="relative overflow-hidden rounded border border-primary/30 bg-card/60 backdrop-blur p-5 scanline">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-primary text-sm">
            <Cpu className="w-4 h-4" />
            <span className="cursor-blink">INPUT_BUFFER</span>
          </div>
          <span className="text-xs text-muted-foreground">{text.length} chars</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="> paste email content here for classification..."
          className="w-full h-40 bg-background/80 border border-primary/20 rounded p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none font-mono"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {SAMPLE_EMAILS.map((s) => (
            <button
              key={s.label}
              onClick={() => loadSample(s.text)}
              className="text-xs px-3 py-1.5 rounded border border-secondary/40 text-secondary hover:bg-secondary/10 hover:border-secondary transition-all"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <Button
            onClick={analyze}
            disabled={!text.trim() || analyzing}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide animate-pulse-glow"
          >
            <Zap className="w-4 h-4 mr-2" />
            {analyzing ? "ANALYZING..." : "RUN CLASSIFIER"}
          </Button>
          <Button
            variant="outline"
            onClick={() => { setText(""); setResult(null); }}
            className="border-muted text-muted-foreground hover:bg-muted/30"
          >
            CLEAR
          </Button>
        </div>
      </div>

      {/* Analyzing state */}
      {analyzing && (
        <div className="rounded border border-secondary/40 bg-card/60 p-6 text-center">
          <Activity className="w-8 h-8 text-secondary mx-auto mb-3 animate-pulse" />
          <p className="text-secondary text-sm cursor-blink">QUERYING_DEEP_LEARNING_MODEL</p>
        </div>
      )}

      {/* Result */}
      {result && !analyzing && (
        <div className="grid grid-cols-1 gap-4">
          {/* Verdict */}
          <div
            className={`rounded border p-6 backdrop-blur ${
              isSpam
                ? "border-destructive/60 bg-destructive/5 border-glow-danger"
                : "border-primary/60 bg-primary/5 border-glow"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Shield className="w-3 h-3" />
              VERDICT
            </div>
            <div className="flex items-center gap-3 mb-4">
              {isSpam ? (
                <AlertTriangle className="w-12 h-12 text-destructive" />
              ) : (
                <Shield className="w-12 h-12 text-primary" />
              )}
              <div>
                <div
                  className={`text-3xl font-bold tracking-tight ${
                    isSpam ? "text-destructive text-glow-danger" : "text-primary text-glow"
                  }`}
                >
                  {result.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(result.confidence * 100).toFixed(1)}% confidence
                </div>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="space-y-2 mt-6">
              <div className="flex justify-between text-xs">
                <span className="text-primary">LEGITIMATE</span>
                <span className="text-destructive">SPAM</span>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700"
                  style={{
                    width: `${result.probabilities.spam * 100}%`,
                    background: "linear-gradient(90deg, hsl(142 100% 50%), hsl(60 100% 50%), hsl(0 95% 60%))",
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground"
                  style={{ left: `${result.probabilities.spam * 100}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Ham: {(result.probabilities.ham * 100).toFixed(2)}%</span>
                <span>Spam: {(result.probabilities.spam * 100).toFixed(2)}%</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border flex justify-between text-xs">
              <span className="text-muted-foreground">⚡ {result.processingTimeMs.toFixed(2)}ms latency</span>
              <span className="text-secondary">TensorFlow DL Model</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailClassifier;
