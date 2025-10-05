"use client";

import React, { useState, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;
    const newMessages = [...messages, { role: "user", content: prompt }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const assistant: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistant]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistant.content += parseStreamChunk(chunk);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...assistant };
          return copy;
        });
        queueMicrotask(() => {
          containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
        });
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I hit an error: ${err?.message || String(err)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function parseStreamChunk(chunk: string): string {
    if (chunk.includes("data:")) {
      const lines = chunk.split(/\n/).map((l) => l.trim()).filter(Boolean);
      let acc = "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content ?? "";
          if (typeof delta === "string") acc += delta;
          const outDelta = json?.output_text?.[0]?.content ?? json?.output_text_delta ?? "";
          if (typeof outDelta === "string") acc += outDelta;
        } catch {
          acc += data;
        }
      }
      return acc;
    }
    return chunk;
  }

  return (
    <div className="mx-auto max-w-3xl p-4 h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-2xl font-semibold mb-4">Exoplanet Chat</h1>
      <div
        ref={containerRef}
        className="flex-1 overflow-auto rounded border p-3 space-y-3 bg-background/50"
      >
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Ask me anything about exoplanets. I can also tell you about our app's
            model capabilities. For example: "How many models do you support?"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={
                "inline-block rounded px-3 py-2 text-sm " +
                (m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-zinc-800")
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-muted-foreground">Thinking…</div>
        )}
      </div>
      <form onSubmit={sendMessage} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question about exoplanets…"
          className="flex-1 border rounded px-3 py-2 bg-background"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="border rounded px-4 py-2 bg-foreground text-background disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
