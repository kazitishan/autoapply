"use client";
import CsvTable from "@/components/CsvTable";

const COLUMNS = [
  { key: "Link", label: "Link", editable: true },
  { key: "Notes", label: "Notes", editable: true },
];

export default function ApplyPage() {
  return (
    <div className="px-6 py-8 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Apply</h1>
        <p className="text-muted-foreground mt-1">
          Track job listings you want to apply to
        </p>
        <button
          onClick={() => fetch("/api/launch", { method: "POST" })}
          className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          Auto Apply
        </button>
      </div>
      <CsvTable apiPath="/api/apply" columns={COLUMNS} reorderable />
    </div>
  );
}
