"use client";
import CsvTable from "@/components/CsvTable";

const STATUS_OPTIONS = [
  "Pending",
  "Online Assessment",
  "Video Interview",
  "Interview",
  "Accepted",
  "Declined",
];

const COLUMNS = [
  { key: "Time & Date", label: "Time & Date", editable: false },
  { key: "Company", label: "Company", editable: false },
  { key: "Position", label: "Position", editable: false },
  {
    key: "Status",
    label: "Status",
    editable: true,
    type: "select",
    options: STATUS_OPTIONS,
  },
  { key: "Link", label: "Link", editable: false },
  { key: "Notes", label: "Notes", editable: true },
];

export default function AppliedPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applied</h1>
        <p className="text-muted-foreground mt-1">
          Jobs you have already applied to
        </p>
      </div>
      <CsvTable apiPath="/api/applied" columns={COLUMNS} canAddRow={false} />
    </div>
  );
}
