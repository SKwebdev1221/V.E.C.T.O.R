// Mock email feed simulating a real-time mail API.
// In production, replace `fetchInitialEmails` and `subscribeToNewEmails`
// with calls to your real mail backend (Gmail API, IMAP bridge, etc.).

export interface RawEmail {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  receivedAt: number; // epoch ms
}

const SENDERS = [
  { name: "Sarah Chen", email: "sarah.chen@company.io" },
  { name: "GitHub", email: "noreply@github.com" },
  { name: "LuckyDraw Intl.", email: "winner@lucky-draw-intl.tk" },
  { name: "Maria Lopez", email: "maria.lopez@partner.co" },
  { name: "CryptoBoost", email: "promo@cryptoboost-fast.xyz" },
  { name: "John Park", email: "john.park@company.io" },
  { name: "PharmaDeals", email: "deals@pharma-cheap.win" },
  { name: "Acme HR", email: "hr@acme.com" },
  { name: "Stripe", email: "receipts@stripe.com" },
  { name: "Prince Adewale", email: "prince.a@royalty-fund.tk" },
];

const TEMPLATES: Array<Omit<RawEmail, "id" | "receivedAt" | "sender" | "senderEmail">> = [
  {
    subject: "Q3 report — please review before Friday",
    body: "Hi team, please find attached the Q3 report. Let's discuss the key findings during our meeting tomorrow at 10am. Thanks for your hard work this quarter. Best regards, Sarah",
  },
  {
    subject: "🎉 YOU WON $1,000,000!!! CLAIM NOW",
    body: "CONGRATULATIONS!!! You have WON $1,000,000 in our exclusive lottery! Click here to CLAIM your PRIZE now before this limited time offer expires! 100% guaranteed cash, no obligation! http://bit.ly/claim-prize",
  },
  {
    subject: "Project review scheduled for Friday",
    body: "Hi John, just confirming our schedule for the project review on Friday. The agenda is attached. Please let me know if you'd like to add any items. Regards, Maria",
  },
  {
    subject: "URGENT: Earn $5000/day with bitcoin",
    body: "URGENT: Earn $5000/day with our exclusive bitcoin investment opportunity! Act now! Guaranteed income! Subscribe today and claim your free crypto bonus! https://cryptoboost-fast.xyz/win",
  },
  {
    subject: "[GitHub] New pull request opened",
    body: "A new pull request has been opened in your repository. Please review when you have a chance. Thanks for contributing to the project.",
  },
  {
    subject: "Cheap viagra — 80% off today only!",
    body: "Cheap viagra! Buy now, get 80% discount! Risk-free guarantee. Click http://bit.ly/cheap-meds to order. Limited stock available!",
  },
  {
    subject: "Onboarding paperwork for new hire",
    body: "Hi, please find attached the onboarding paperwork for the new hire starting Monday. Let me know if anything needs updating. Thanks, HR Team",
  },
  {
    subject: "Your Stripe receipt",
    body: "Thanks for your payment. Please find your receipt attached for your records. Regards, Stripe.",
  },
  {
    subject: "Confidential business proposal",
    body: "Dear friend, I am Prince Adewale and I have an URGENT confidential investment opportunity worth $25,000,000 USD. Please claim your share now! 100% risk-free guarantee.",
  },
  {
    subject: "Standup notes & action items",
    body: "Hi team, sharing the standup notes from this morning. Action items assigned in the doc. Let's review progress at the end of the week. Regards, John",
  },
];

let counter = 0;
const newId = () => `email_${Date.now()}_${counter++}`;

export function fetchInitialEmails(): RawEmail[] {
  const now = Date.now();
  return TEMPLATES.map((t, i) => {
    const s = SENDERS[i % SENDERS.length];
    return {
      id: newId(),
      sender: s.name,
      senderEmail: s.email,
      subject: t.subject,
      body: t.body,
      receivedAt: now - (i + 1) * 1000 * 60 * (5 + Math.random() * 30),
    };
  });
}

// Simulates push notifications from a mail server.
// Returns an unsubscribe function.
export function subscribeToNewEmails(
  onEmail: (email: RawEmail) => void,
  intervalMs = 12000,
): () => void {
  const id = setInterval(() => {
    const t = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const s = SENDERS[Math.floor(Math.random() * SENDERS.length)];
    onEmail({
      id: newId(),
      sender: s.name,
      senderEmail: s.email,
      subject: t.subject,
      body: t.body,
      receivedAt: Date.now(),
    });
  }, intervalMs);
  return () => clearInterval(id);
}
