export interface ClassificationResult {
  label: "SPAM" | "LEGITIMATE";
  confidence: number;
  probabilities: { spam: number; ham: number };
  processingTimeMs: number;
}

export async function classifyEmail(text: string): Promise<ClassificationResult> {
  const start = performance.now();
  
  try {
    const response = await fetch("http://localhost:8000/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      label: data.label === "Spam" ? "SPAM" : "LEGITIMATE",
      confidence: data.confidence,
      probabilities: { spam: data.score, ham: 1 - data.score },
      processingTimeMs: performance.now() - start,
    };
  } catch (error) {
    console.error("Classification failed:", error);
    // Fallback if backend is down
    return {
      label: "LEGITIMATE",
      confidence: 0,
      probabilities: { spam: 0, ham: 1 },
      processingTimeMs: performance.now() - start,
    };
  }
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
