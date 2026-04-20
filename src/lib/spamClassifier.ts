// Lightweight client-side spam classifier
// Combines rule-based text features + character-level embedding similarity

export interface FeatureScore {
  name: string;
  value: number;
  weight: number;
  description: string;
  triggered: boolean;
}

export interface ClassificationResult {
  label: "SPAM" | "LEGITIMATE";
  confidence: number;
  spamScore: number;
  features: FeatureScore[];
  embedding: number[];
  similarity: { spam: number; ham: number };
  processingTimeMs: number;
}

// Spam trigger lexicon
const SPAM_KEYWORDS = [
  "free", "winner", "won", "cash", "prize", "click here", "buy now", "limited time",
  "act now", "urgent", "congratulations", "credit", "loan", "viagra", "guarantee",
  "risk-free", "100%", "earn money", "income", "investment", "bitcoin", "crypto",
  "lottery", "claim", "exclusive deal", "subscribe", "unsubscribe", "offer expires",
  "no obligation", "discount", "cheap", "cheapest", "save up to", "miracle",
];

const LEGIT_KEYWORDS = [
  "meeting", "report", "schedule", "agenda", "regards", "thanks", "thank you",
  "attached", "please find", "team", "project", "deadline", "review", "discuss",
  "morning", "afternoon", "regards", "sincerely", "best",
];

// Reference centroid embeddings (pre-computed conceptually)
const SPAM_CENTROID = generateCharNgramEmbedding(
  "free win cash prize click buy now urgent winner congratulations claim offer money guaranteed limited"
);
const HAM_CENTROID = generateCharNgramEmbedding(
  "hi team please find attached report meeting tomorrow project update thanks regards review discuss schedule"
);

function generateCharNgramEmbedding(text: string, dim = 64): number[] {
  const vec = new Array(dim).fill(0);
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  for (let i = 0; i < normalized.length - 2; i++) {
    const tri = normalized.slice(i, i + 3);
    let hash = 0;
    for (let j = 0; j < tri.length; j++) {
      hash = (hash * 31 + tri.charCodeAt(j)) >>> 0;
    }
    vec[hash % dim] += 1;
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export function classifyEmail(text: string): ClassificationResult {
  const start = performance.now();
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const wordCount = words.length || 1;

  // Feature 1: Spam keyword density
  let spamHits = 0;
  SPAM_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) spamHits++;
  });
  const spamDensity = spamHits / Math.max(SPAM_KEYWORDS.length, 1);

  // Feature 2: Legitimate keyword presence
  let hamHits = 0;
  LEGIT_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) hamHits++;
  });
  const hamDensity = hamHits / Math.max(LEGIT_KEYWORDS.length, 1);

  // Feature 3: Excessive caps
  const upperChars = (text.match(/[A-Z]/g) || []).length;
  const totalChars = text.replace(/\s/g, "").length || 1;
  const capsRatio = upperChars / totalChars;

  // Feature 4: Excessive punctuation (!!!)
  const exclaim = (text.match(/!/g) || []).length;
  const exclaimRatio = Math.min(exclaim / wordCount, 1);

  // Feature 5: Money/currency symbols
  const moneyMatches = (text.match(/[$€£]\s?\d+|\d+\s?(usd|eur|gbp|dollars)/gi) || []).length;
  const moneySignal = Math.min(moneyMatches / 3, 1);

  // Feature 6: Suspicious URLs
  const urls = text.match(/https?:\/\/\S+/gi) || [];
  const suspiciousUrl = urls.some((u) =>
    /bit\.ly|tinyurl|free|win|claim|prize|\.tk\b|\.xyz\b/i.test(u)
  );
  const urlSignal = suspiciousUrl ? 1 : Math.min(urls.length / 5, 0.3);

  // Feature 7: Embedding similarity
  const embedding = generateCharNgramEmbedding(text);
  const simSpam = cosineSim(embedding, SPAM_CENTROID);
  const simHam = cosineSim(embedding, HAM_CENTROID);
  const embeddingSignal = Math.max(0, simSpam - simHam);

  const features: FeatureScore[] = [
    {
      name: "Spam Lexicon",
      value: spamDensity,
      weight: 0.25,
      description: `${spamHits} spam trigger words detected`,
      triggered: spamHits >= 2,
    },
    {
      name: "Professional Tone",
      value: 1 - hamDensity,
      weight: 0.15,
      description: `${hamHits} professional words found`,
      triggered: hamHits === 0,
    },
    {
      name: "ALL CAPS Ratio",
      value: capsRatio,
      weight: 0.1,
      description: `${(capsRatio * 100).toFixed(1)}% uppercase characters`,
      triggered: capsRatio > 0.3,
    },
    {
      name: "Exclamation Density",
      value: exclaimRatio,
      weight: 0.1,
      description: `${exclaim} exclamation marks`,
      triggered: exclaim >= 3,
    },
    {
      name: "Money Signals",
      value: moneySignal,
      weight: 0.15,
      description: `${moneyMatches} currency mentions`,
      triggered: moneyMatches >= 1,
    },
    {
      name: "URL Risk",
      value: urlSignal,
      weight: 0.1,
      description: suspiciousUrl ? "Suspicious link pattern" : `${urls.length} link(s) found`,
      triggered: suspiciousUrl,
    },
    {
      name: "Embedding Similarity",
      value: embeddingSignal,
      weight: 0.15,
      description: `Spam: ${simSpam.toFixed(3)} · Ham: ${simHam.toFixed(3)}`,
      triggered: simSpam > simHam,
    },
  ];

  const spamScore = features.reduce((s, f) => s + f.value * f.weight, 0);
  const normalized = Math.min(Math.max(spamScore * 1.6, 0), 1);
  const label: "SPAM" | "LEGITIMATE" = normalized >= 0.45 ? "SPAM" : "LEGITIMATE";
  const confidence = label === "SPAM" ? normalized : 1 - normalized;

  return {
    label,
    confidence,
    spamScore: normalized,
    features,
    embedding,
    similarity: { spam: simSpam, ham: simHam },
    processingTimeMs: performance.now() - start,
  };
}

export const SAMPLE_EMAILS = [
  {
    label: "🎰 Lottery Scam",
    text: "CONGRATULATIONS!!! You have WON $1,000,000 in our exclusive lottery! Click here to CLAIM your PRIZE now before this limited time offer expires! 100% guaranteed cash, no obligation!",
  },
  {
    label: "📊 Work Email",
    text: "Hi team, please find attached the Q3 report. Let's discuss the key findings during our meeting tomorrow at 10am. Thanks for your hard work this quarter. Best regards, Sarah",
  },
  {
    label: "💊 Pharma Spam",
    text: "Cheap viagra! Buy now, get 80% discount! Risk-free guarantee. Click http://bit.ly/cheap-meds to order. Limited stock available!",
  },
  {
    label: "📅 Meeting Invite",
    text: "Hi John, just confirming our schedule for the project review on Friday. The agenda is attached. Please let me know if you'd like to add any items. Regards, Maria",
  },
  {
    label: "💰 Crypto Scam",
    text: "URGENT: Earn $5000/day with our exclusive bitcoin investment opportunity! Act now! Guaranteed income! Subscribe today and claim your free crypto bonus!",
  },
];
