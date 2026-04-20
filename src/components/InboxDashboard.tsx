import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Inbox,
  Search,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Mail,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { classifyEmail, type ClassificationResult } from "@/lib/spamClassifier";
import {
  fetchInitialEmails,
  subscribeToNewEmails,
  type RawEmail,
} from "@/lib/mockEmails";
import { cn } from "@/lib/utils";

type Verdict = "SPAM" | "LEGITIMATE";
type FilterMode = "all" | "spam" | "ham";
type SortMode = "date_desc" | "date_asc" | "sender_asc";

interface ClassifiedEmail extends RawEmail {
  classification: ClassificationResult;
  label: Verdict; // current effective label (after manual override)
  overridden: boolean;
}

function classify(email: RawEmail): ClassifiedEmail {
  const c = classifyEmail(`${email.subject}\n${email.body}`);
  return { ...email, classification: c, label: c.label, overridden: false };
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const InboxDashboard = () => {
  const [emails, setEmails] = useState<ClassifiedEmail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("date_desc");

  // Initial load
  useEffect(() => {
    const initial = fetchInitialEmails().map(classify);
    setEmails(initial);
    setSelectedId(initial[0]?.id ?? null);
  }, []);

  // Real-time stream
  useEffect(() => {
    const unsub = subscribeToNewEmails((raw) => {
      const c = classify(raw);
      setEmails((prev) => [c, ...prev]);
      if (c.label === "SPAM") {
        toast.error(`🚨 New spam detected from ${c.sender}`, {
          description: c.subject,
        });
      } else {
        toast(`📬 New email from ${c.sender}`, { description: c.subject });
      }
    });
    return unsub;
  }, []);

  const stats = useMemo(() => {
    const spam = emails.filter((e) => e.label === "SPAM").length;
    return { total: emails.length, spam, ham: emails.length - spam };
  }, [emails]);

  const visible = useMemo(() => {
    let list = emails;
    if (filter === "spam") list = list.filter((e) => e.label === "SPAM");
    if (filter === "ham") list = list.filter((e) => e.label === "LEGITIMATE");
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.sender.toLowerCase().includes(q) ||
          e.senderEmail.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      if (sort === "date_desc") return b.receivedAt - a.receivedAt;
      if (sort === "date_asc") return a.receivedAt - b.receivedAt;
      return a.sender.localeCompare(b.sender);
    });
    return list;
  }, [emails, filter, query, sort]);

  const selected = visible.find((e) => e.id === selectedId) ?? visible[0];

  const overrideLabel = (id: string, newLabel: Verdict) => {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, label: newLabel, overridden: e.classification.label !== newLabel }
          : e,
      ),
    );
    toast.success(`Marked as ${newLabel === "SPAM" ? "Spam" : "Not Spam"}`, {
      description: "Feedback recorded for model improvement.",
    });
  };

  const deleteEmail = (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const refresh = () => {
    const fresh = fetchInitialEmails().map(classify);
    setEmails(fresh);
    setSelectedId(fresh[0]?.id ?? null);
    toast("Inbox refreshed");
  };

  return (
    <section aria-label="Email inbox dashboard" className="space-y-4">
      {/* Toolbar */}
      <div className="rounded border border-primary/30 bg-card/60 backdrop-blur p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-primary text-sm">
            <Inbox className="w-4 h-4" />
            <span className="font-semibold tracking-wide">INBOX</span>
            <span className="text-muted-foreground text-xs">
              {stats.total} total · {stats.spam} spam · {stats.ham} legit
            </span>
          </div>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sender, subject, body..."
              className="pl-9 bg-background/80 border-primary/20 focus-visible:ring-primary"
              aria-label="Search emails"
            />
          </div>

          <div className="flex gap-1 rounded border border-primary/20 p-1 bg-background/60">
            {(["all", "ham", "spam"] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-xs px-3 py-1 rounded transition-colors",
                  filter === f
                    ? f === "spam"
                      ? "bg-destructive/20 text-destructive"
                      : f === "ham"
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary/20 text-secondary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "all" ? "All" : f === "spam" ? "Spam" : "Legit"}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              setSort((s) =>
                s === "date_desc" ? "date_asc" : s === "date_asc" ? "sender_asc" : "date_desc",
              )
            }
            className="text-xs px-3 py-2 rounded border border-primary/20 text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center gap-1"
            aria-label="Change sort order"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sort === "date_desc"
              ? "Newest"
              : sort === "date_asc"
                ? "Oldest"
                : "Sender A-Z"}
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Inbox + preview */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Email list */}
        <div className="lg:col-span-2 rounded border border-primary/20 bg-card/40 backdrop-blur overflow-hidden">
          <div className="max-h-[640px] overflow-y-auto divide-y divide-border">
            {visible.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No emails match your filters.
              </div>
            )}
            {visible.map((e) => {
              const isSpam = e.label === "SPAM";
              const isSelected = selected?.id === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={cn(
                    "w-full text-left p-3 transition-colors block hover:bg-muted/30",
                    isSelected && "bg-muted/40",
                    isSpam && "border-l-2 border-l-destructive",
                    !isSpam && "border-l-2 border-l-primary/60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm truncate text-foreground">
                      {e.sender}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(e.receivedAt)}
                    </span>
                  </div>
                  <div className="text-xs text-foreground/90 truncate mb-1">
                    {e.subject}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mb-2">
                    {e.body}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isSpam ? "destructive" : "default"}
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        !isSpam && "bg-primary/20 text-primary border border-primary/40",
                      )}
                    >
                      {isSpam ? (
                        <>
                          <ShieldAlert className="w-3 h-3 mr-1" /> SPAM
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3 h-3 mr-1" /> LEGIT
                        </>
                      )}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {(e.classification.confidence * 100).toFixed(0)}%
                    </span>
                    {e.overridden && (
                      <span className="text-[10px] text-accent">manual</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-3 rounded border border-primary/20 bg-card/40 backdrop-blur p-5 min-h-[400px]">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Mail className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-sm">Select an email to preview</p>
            </div>
          ) : (
            <article>
              <header className="pb-4 mb-4 border-b border-border">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-lg font-bold text-foreground leading-tight">
                    {selected.subject}
                  </h2>
                  <Badge
                    variant={selected.label === "SPAM" ? "destructive" : "default"}
                    className={cn(
                      selected.label === "LEGITIMATE" &&
                        "bg-primary/20 text-primary border border-primary/40",
                    )}
                  >
                    {selected.label === "SPAM" ? (
                      <>
                        <ShieldAlert className="w-3 h-3 mr-1" /> SPAM
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 mr-1" /> LEGITIMATE
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <span className="text-foreground font-medium">{selected.sender}</span>{" "}
                    &lt;{selected.senderEmail}&gt;
                  </span>
                  <span>·</span>
                  <span>{new Date(selected.receivedAt).toLocaleString()}</span>
                  <span>·</span>
                  <span>
                    confidence {(selected.classification.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </header>

              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-5">
                {selected.body}
              </p>

              {/* Top features */}
              <div className="rounded bg-background/60 border border-border p-3 mb-5">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Why this verdict
                </div>
                <ul className="space-y-1">
                  {selected.classification.features
                    .slice()
                    .sort((a, b) => b.value * b.weight - a.value * a.weight)
                    .slice(0, 3)
                    .map((f) => (
                      <li
                        key={f.name}
                        className="flex justify-between text-xs gap-2"
                      >
                        <span
                          className={cn(
                            f.triggered ? "text-destructive" : "text-foreground",
                          )}
                        >
                          {f.triggered ? "▶ " : "· "}
                          {f.name}
                        </span>
                        <span className="text-muted-foreground">{f.description}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {selected.label === "SPAM" ? (
                  <Button
                    onClick={() => overrideLabel(selected.id, "LEGITIMATE")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <ShieldCheck className="w-4 h-4 mr-1" /> Mark as Not Spam
                  </Button>
                ) : (
                  <Button
                    onClick={() => overrideLabel(selected.id, "SPAM")}
                    variant="destructive"
                  >
                    <ShieldAlert className="w-4 h-4 mr-1" /> Mark as Spam
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => deleteEmail(selected.id)}
                  className="border-muted text-muted-foreground hover:bg-muted/30"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
};

export default InboxDashboard;
