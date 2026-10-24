"use client";

import * as React from "react";
import { Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { AIDisclaimer, EmergencyBanner, detectEmergency } from "@/components/ai/ai-disclaimer";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "ai"; text: string; emergency?: boolean };

export function AssistantThread({ userName }: { userName: string }) {
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      role: "ai",
      text:
        "Hi, I'm Aafiyat — your Gb Elaaj health assistant. I can help you understand reports, prepare questions for your doctor, or find the right specialist. What's on your mind today?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function send() {
    const text = input.trim();
    if (!text) return;
    const emergency = detectEmergency(text);
    setMessages((m) => [...m, { role: "user", text, emergency }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      setMessages((m) => [...m, { role: "ai", text: json.data?.reply ?? json.error?.message ?? "Sorry, I couldn't reply right now." }]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_280px]">
      <Card className="flex h-[60vh] flex-col p-0">
        <div className="border-b border-ge-border p-4">
          <AIDisclaimer />
        </div>
        <div className="flex-1 overflow-auto p-4">
          <ul className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <li key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    m.role === "ai" ? "bg-ge-primary/10 text-ge-primary" : "bg-ge-navy text-white"
                  )}
                  aria-hidden
                >
                  {m.role === "ai" ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </span>
                <div className={cn("max-w-[70%] space-y-2", m.role === "user" && "items-end")}>
                  {m.emergency && <EmergencyBanner />}
                  <div
                    className={cn(
                      "rounded-lg p-3 text-[13.5px] leading-relaxed",
                      m.role === "ai"
                        ? "bg-ge-soft-bg text-ge-ink"
                        : "bg-ge-primary text-white"
                    )}
                  >
                    {m.text}
                  </div>
                  {m.role === "ai" && (
                    <p className="text-[11px] text-ge-muted">
                      Aafiyat does not prescribe medication. For diagnosis, please consult a qualified doctor.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-ge-border p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe what you're feeling, or ask about a report…"
              className="max-h-32 min-h-[44px]"
            />
            <Button onClick={send} loading={sending} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-ge-muted">⌘ + Enter to send · Avoid sharing sensitive identifiers.</p>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Avatar name={userName} size={36} />
          <div>
            <div className="text-[13px] font-semibold text-ge-ink">{userName.split(" ")[0]}'s thread</div>
            <div className="text-[11px] text-ge-muted">Private · stored under your records</div>
          </div>
        </div>
        <h3 className="mt-4 text-[12.5px] font-semibold text-ge-navy">What Aafiyat does</h3>
        <ul className="mt-2 space-y-1.5 text-[12.5px] text-ge-ink">
          <li>· Explains lab reports in plain language</li>
          <li>· Suggests the right specialty</li>
          <li>· Helps prep questions for your doctor</li>
        </ul>
        <h3 className="mt-4 text-[12.5px] font-semibold text-ge-navy">What it doesn't do</h3>
        <ul className="mt-2 space-y-1.5 text-[12.5px] text-ge-muted">
          <li>· Prescribe medication</li>
          <li>· Diagnose conditions</li>
          <li>· Replace emergency care</li>
        </ul>
      </Card>
    </div>
  );
}
