"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function parseRow(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let field = "";
      i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++;
          break;
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return fields;
}

function parseCsv(text) {
  const lines = text.trim().split("\n");
  if (!lines[0]?.trim()) return { headers: [], rows: [] };
  const headers = parseRow(lines[0]);
  const rows = lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = parseRow(line);
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });
  return { headers, rows };
}

function escapeField(val) {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function serializeCsv(headers, rows) {
  return [
    headers.map(escapeField).join(","),
    ...rows.map((row) => headers.map((h) => escapeField(row[h] ?? "")).join(",")),
  ].join("\n");
}

function genId() {
  return crypto.randomUUID();
}

function LinkCell({ href }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={handleCopy}
        disabled={!href}
      >
        {copied ? "Copied!" : "Copy"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        disabled={!href}
        asChild
      >
        <a href={href} target="_blank" rel="noopener noreferrer">
          Open
        </a>
      </Button>
    </div>
  );
}

export default function CsvTable({
  apiPath,
  columns,
  canAddRow = true,
  canDelete = true,
  rowClassName,
  rowActions,
  reorderable = false,
}) {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const dragIdx = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  useEffect(() => {
    fetch(apiPath)
      .then((r) => r.text())
      .then((text) => {
        const { headers, rows } = parseCsv(text);
        setHeaders(headers);
        setRows(rows.map((r) => ({ ...r, _id: genId() })));
        setLoading(false);
      });
  }, [apiPath]);

  const save = useCallback(
    async (newRows) => {
      const clean = newRows.map(({ _id, ...rest }) => rest);
      await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: serializeCsv(headers, clean),
      });
    },
    [apiPath, headers]
  );

  function handleCellBlur(rowIdx, key, value) {
    const newRows = rows.map((r, i) =>
      i === rowIdx ? { ...r, [key]: value } : r
    );
    setRows(newRows);
    save(newRows);
  }

  function handleSelectChange(rowIdx, key, value) {
    const newRows = rows.map((r, i) =>
      i === rowIdx ? { ...r, [key]: value } : r
    );
    setRows(newRows);
    save(newRows);
  }

  function handleAddRow() {
    const newRow = {
      ...Object.fromEntries(headers.map((h) => [h, ""])),
      _id: genId(),
    };
    const newRows = [...rows, newRow];
    setRows(newRows);
    save(newRows);
  }

  function handleDeleteRow(rowIdx) {
    const newRows = rows.filter((_, i) => i !== rowIdx);
    setRows(newRows);
    save(newRows);
  }

  function handleDragStart(idx) {
    dragIdx.current = idx;
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
    setDragOverIdx(idx);
  }

  function handleDrop(e, idx) {
    e.preventDefault();
    setDragOverIdx(null);
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    const newRows = [...rows];
    const [moved] = newRows.splice(from, 1);
    newRows.splice(idx, 0, moved);
    setRows(newRows);
    save(newRows);
    dragIdx.current = null;
  }

  function handleDragEnd() {
    setDragOverIdx(null);
    dragIdx.current = null;
  }

  if (loading)
    return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {reorderable && <th className="w-6 px-2" />}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-center font-medium text-muted-foreground whitespace-nowrap border-r last:border-r-0"
                >
                  {col.label}
                </th>
              ))}
              {rowActions && <th className="px-2" />}
              {canDelete && <th className="w-8 px-2" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (reorderable ? 1 : 0) + (rowActions ? 1 : 0) + (canDelete ? 1 : 0)}
                  className="px-3 py-8 text-center text-muted-foreground text-sm"
                >
                  No rows yet.{canAddRow && " Click Add Row to get started."}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr
                  key={row._id}
                  draggable={reorderable}
                  onDragStart={reorderable ? () => handleDragStart(rowIdx) : undefined}
                  onDragOver={reorderable ? (e) => handleDragOver(e, rowIdx) : undefined}
                  onDrop={reorderable ? (e) => handleDrop(e, rowIdx) : undefined}
                  onDragEnd={reorderable ? handleDragEnd : undefined}
                  className={`border-b last:border-0 ${
                    dragOverIdx === rowIdx ? "border-t-2 border-t-primary" : ""
                  } ${reorderable ? "cursor-grab" : ""} ${
                    rowClassName ? rowClassName(row) : "hover:bg-muted/25"
                  }`}
                >
                  {reorderable && (
                    <td className="px-2 py-1.5 text-center text-muted-foreground select-none">
                      ⠿
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 py-1.5 border-r last:border-r-0">
                      {col.type === "link" ? (
                        <LinkCell href={row[col.key]} />
                      ) : !col.editable ? (
                        <span className="px-1 text-sm">{row[col.key]}</span>
                      ) : col.type === "select" ? (
                        <Select
                          value={row[col.key] || ""}
                          onValueChange={(v) =>
                            handleSelectChange(rowIdx, col.key, v)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs min-w-36">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {col.options.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          defaultValue={row[col.key] ?? ""}
                          onBlur={(e) =>
                            handleCellBlur(rowIdx, col.key, e.target.value)
                          }
                          className="h-8 text-xs min-w-40"
                        />
                      )}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-2 py-1.5 text-center whitespace-nowrap">
                      {rowActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => action.onClick(row)}
                          className="text-xs px-2 py-1 rounded border border-input hover:bg-muted transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </td>
                  )}
                  {canDelete && (
                    <td className="px-2 py-1.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(rowIdx)}
                        className="opacity-40 hover:opacity-100 transition-opacity"
                        aria-label="Delete row"
                      >
                        <img src="/delete.svg" alt="delete" className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {canAddRow && (
        <Button variant="outline" size="sm" onClick={handleAddRow}>
          + Add Row
        </Button>
      )}
    </div>
  );
}
