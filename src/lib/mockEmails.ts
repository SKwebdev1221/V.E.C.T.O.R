export interface RawEmail {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  receivedAt: number; // epoch ms
}

export function getStoredEmails(): RawEmail[] {
  try {
    const stored = localStorage.getItem("user_emails");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse stored emails", e);
  }
  return [];
}

export function saveEmail(text: string): RawEmail {
  const emails = getStoredEmails();
  const lines = text.split("\n");
  const subject = lines[0].slice(0, 50) + (lines[0].length > 50 ? "..." : "");
  
  const newEmail: RawEmail = {
    id: `email_${Date.now()}`,
    sender: "Manual Input",
    senderEmail: "user@local.app",
    subject: subject || "No Subject",
    body: text,
    receivedAt: Date.now(),
  };
  
  emails.unshift(newEmail);
  localStorage.setItem("user_emails", JSON.stringify(emails));
  
  // Notify other components
  window.dispatchEvent(new Event("emails_updated"));
  
  return newEmail;
}

export function deleteStoredEmail(id: string) {
  const emails = getStoredEmails();
  const filtered = emails.filter((e) => e.id !== id);
  localStorage.setItem("user_emails", JSON.stringify(filtered));
}

export function clearStoredEmails() {
  localStorage.removeItem("user_emails");
  window.dispatchEvent(new Event("emails_updated"));
}
