"use client";
import { useState, useRef } from "react";
import CsvTable from "@/components/CsvTable";

const COLUMNS = [
  { key: "Link", label: "Link", editable: true },
  { key: "Notes", label: "Notes", editable: true },
];

function ProgressPanel({ events, onClose }) {
  const endRef = useRef(null);

  const iconFor = (type) => {
    if (type === "done") return "✓";
    if (type === "error") return "✗";
    if (type === "warning") return "⚠";
    if (type === "action") return "→";
    return "•";
  };

  const colorFor = (type) => {
    if (type === "done") return "text-green-600";
    if (type === "error") return "text-red-500";
    if (type === "warning") return "text-yellow-600";
    if (type === "action") return "text-blue-600";
    return "text-muted-foreground";
  };

  const isDone = events.some((e) => e.type === "done" || e.type === "error");

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-background rounded-lg border shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Auto Apply Progress</h2>
          {isDone && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {events.map((e, i) => (
            <div key={i} className={`flex gap-2 text-sm ${colorFor(e.type)}`}>
              <span className="shrink-0 w-4 text-center">{iconFor(e.type)}</span>
              <span>{e.message || e.description}</span>
            </div>
          ))}
          {!isDone && (
            <div className="flex gap-2 text-sm text-muted-foreground animate-pulse">
              <span className="shrink-0 w-4 text-center">•</span>
              <span>Working...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  const [events, setEvents] = useState(null);

  async function handleAutoApply(row) {
    if (!row.Link) return;
    setEvents([]);

    const response = await fetch("/api/auto-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: row.Link, notes: row.Notes }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop();
      for (const part of parts) {
        if (part.startsWith("data: ")) {
          try {
            const data = JSON.parse(part.slice(6));
            setEvents((prev) => [...prev, data]);
          } catch {
            // ignore malformed events
          }
        }
      }
    }
  }

  const rowActions = [
    {
      label: "Auto Apply",
      onClick: handleAutoApply,
    },
  ];

  return (
    <div className="px-6 py-8 space-y-4">
      {events !== null && (
        <ProgressPanel events={events} onClose={() => setEvents(null)} />
      )}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Apply</h1>
        <p className="text-muted-foreground mt-1">
          Track job listings you want to apply to
        </p>
      </div>
      <CsvTable apiPath="/api/apply" columns={COLUMNS} rowActions={rowActions} />
    </div>
  );
}
