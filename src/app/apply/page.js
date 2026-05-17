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
      </div>
      <CsvTable apiPath="/api/apply" columns={COLUMNS} />
    </div>
  );
}
