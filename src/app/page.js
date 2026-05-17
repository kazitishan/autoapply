"use client";

import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS = {
  months: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  gender: ["Male", "Female", "Decline to answer"],
  ethnicity: ["Hispanic or Latino", "Not Hispanic or Latino"],
  race: [
    "Decline to answer",
    "Hispanic or Latino",
    "White, not Hispanic or Latino",
    "Black or African-American, not Hispanic or Latino",
    "Asian, not Hispanic or Latino",
    "Native Hawaiian or Other Pacific Islander, not Hispanic or Latino",
    "American Indian or Alaskan Native, not Hispanic or Latino",
    "Two or More Races, not Hispanic or Latino",
  ],
  veteran: [
    "I identify as one or more of the classifications of protected veteran listed above",
    "I am not a protected veteran",
    "I don't wish to answer",
  ],
  disability: [
    "Yes, I have a disability, or have had one in the past",
    "No, I do not have a disability and have not had one in the past",
    "I do not want to answer",
  ],
  yesNo: ["Yes", "No"],
  languageLevel: [
    "1 - Elementary",
    "2 - Limited Working",
    "3 - Professional Working",
    "4 - Full Professional",
    "5 - Fluent",
  ],
};

function withIds(arr) {
  return arr.map((item) => ({ ...item, _id: crypto.randomUUID() }));
}

function stripIds(arr) {
  return arr.map(({ _id, ...rest }) => rest);
}

// ── Reusable field components ──────────────────────────────────────────────

function Field({ label, id, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function CheckField({ label, id, checked, onCheckedChange }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={!!checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

function SelectField({ label, id, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Attachment field ──────────────────────────────────────────────────────

function AttachmentField({ label, filename, onUpload, onDelete, onRename }) {
  const inputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { filename: name } = await res.json();
      await onUpload(name);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function confirmEdit() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== filename) {
      await fetch("/api/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: filename, newName: trimmed }),
      });
      await onRename(trimmed);
    }
    setEditing(false);
  }

  async function handleDelete() {
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    await onDelete();
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx"
      />
      {!filename ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Attach"}
        </Button>
      ) : editing ? (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 h-7"
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmEdit();
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
          />
          <Button size="sm" onClick={confirmEdit}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <span className="flex-1 text-sm truncate">{filename}</span>
          <Button variant="ghost" size="icon" asChild>
            <a href={`/api/file/${encodeURIComponent(filename)}`} target="_blank" rel="noopener noreferrer">
              <img src="/view.svg" className="h-4 w-4" alt="View" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setEditName(filename); setEditing(true); }}>
            <img src="/edit.svg" className="h-4 w-4" alt="Edit name" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <img src="/delete.svg" className="h-4 w-4" alt="Delete" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Sortable item wrapper ──────────────────────────────────────────────────

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card p-4 transition-shadow ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex gap-3">
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none select-none text-muted-foreground hover:text-foreground mt-0.5"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function Home() {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    fetch("/api/info")
      .then((r) => r.json())
      .then((raw) =>
        setData({
          ...raw,
          "school info": withIds(raw["school info"]),
          experience: withIds(raw.experience),
          languages: withIds(raw.languages),
        })
      );
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          "school info": stripIds(data["school info"]),
          experience: stripIds(data.experience),
          languages: stripIds(data.languages),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  // ── Setters ──

  function setPersonal(key, value) {
    setData((d) => ({ ...d, "personal info": { ...d["personal info"], [key]: value } }));
  }
  function setContact(key, value) {
    setData((d) => ({
      ...d,
      "personal info": {
        ...d["personal info"],
        "contact info": { ...d["personal info"]["contact info"], [key]: value },
      },
    }));
  }
  function setAddress(key, value) {
    setData((d) => ({
      ...d,
      "personal info": {
        ...d["personal info"],
        address: { ...d["personal info"].address, [key]: value },
      },
    }));
  }
  function setSchool(index, key, value) {
    setData((d) => ({
      ...d,
      "school info": d["school info"].map((s, i) =>
        i === index ? { ...s, [key]: value } : s
      ),
    }));
  }
  function setExp(index, key, value) {
    setData((d) => ({
      ...d,
      experience: d.experience.map((e, i) =>
        i === index ? { ...e, [key]: value } : e
      ),
    }));
  }
  function setRoleDesc(expIndex, value) {
    setData((d) => ({
      ...d,
      experience: d.experience.map((e, i) =>
        i === expIndex ? { ...e, "role description": value.split("\n") } : e
      ),
    }));
  }
  function setLang(index, key, value) {
    setData((d) => ({
      ...d,
      languages: d.languages.map((l, i) =>
        i === index ? { ...l, [key]: value } : l
      ),
    }));
  }
  async function handleAttachmentChange(key, value) {
    const newAttachments = { ...data.attachments, [key]: value };
    const updated = { ...data, attachments: newAttachments };
    setData(updated);
    await fetch("/api/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updated,
        "school info": stripIds(updated["school info"]),
        experience: stripIds(updated.experience),
        languages: stripIds(updated.languages),
      }),
    });
  }
  function setEEO(key, value) {
    setData((d) => ({
      ...d,
      "equal employment opportunity info": {
        ...d["equal employment opportunity info"],
        [key]: value,
      },
    }));
  }
  function setWorkAuth(key, value) {
    setData((d) => ({
      ...d,
      "work authorization": { ...d["work authorization"], [key]: value },
    }));
  }

  // ── Drag handlers ──

  function handleDragEnd(section, event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setData((d) => {
      const items = d[section];
      const oldIndex = items.findIndex((item) => item._id === active.id);
      const newIndex = items.findIndex((item) => item._id === over.id);
      return { ...d, [section]: arrayMove(items, oldIndex, newIndex) };
    });
  }

  // ── Add handlers ──

  function addSchool() {
    setData((d) => ({
      ...d,
      "school info": [
        ...d["school info"],
        {
          _id: crypto.randomUUID(),
          "school name": "",
          degree: "",
          major: "",
          "start month": "",
          "start year": "",
          "graduation month": "",
          "graduation year": "",
        },
      ],
    }));
  }

  function addExperience() {
    setData((d) => ({
      ...d,
      experience: [
        ...d.experience,
        {
          _id: crypto.randomUUID(),
          "job title": "",
          company: "",
          location: "",
          "current job": false,
          "start month": "",
          "start year": "",
          "end month": null,
          "end year": null,
          "role description": [],
        },
      ],
    }));
  }

  function addLanguage() {
    setData((d) => ({
      ...d,
      languages: [
        ...d.languages,
        {
          _id: crypto.randomUUID(),
          language: "",
          fluent: false,
          reading: "",
          speaking: "",
          writing: "",
          "reading / speaking / writing": "",
          proficiency: "",
        },
      ],
    }));
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  const personal = data["personal info"];
  const contact = personal["contact info"];
  const address = personal.address;

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your application information
          </p>
        </div>

        <Separator />

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Info</CardTitle>
            <CardDescription>Your name, contact details, and address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="First Name"
                id="first-name"
                value={personal["first name"]}
                onChange={(v) => setPersonal("first name", v)}
              />
              <Field
                label="Last Name"
                id="last-name"
                value={personal["last name"]}
                onChange={(v) => setPersonal("last name", v)}
              />
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Contact</p>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Email"
                  id="email"
                  value={contact.email}
                  onChange={(v) => setContact("email", v)}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Field
                    label="Country Code"
                    id="country-code"
                    value={contact["country code"]}
                    onChange={(v) => setContact("country code", v)}
                    placeholder="+1"
                  />
                  <div className="col-span-2">
                    <Field
                      label="Phone"
                      id="phone"
                      value={contact.phone}
                      onChange={(v) => setContact("phone", v)}
                    />
                  </div>
                </div>
                <Field
                  label="LinkedIn"
                  id="linkedin"
                  value={contact.linkedIn}
                  onChange={(v) => setContact("linkedIn", v)}
                />
                <Field
                  label="Website"
                  id="website"
                  value={contact.website}
                  onChange={(v) => setContact("website", v)}
                />
                <Field
                  label="GitHub"
                  id="github"
                  value={contact.github}
                  onChange={(v) => setContact("github", v)}
                />
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Address</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Field
                    label="Street"
                    id="street"
                    value={address.street}
                    onChange={(v) => setAddress("street", v)}
                  />
                </div>
                <Field
                  label="Apt / Unit"
                  id="apt"
                  value={address.apt}
                  onChange={(v) => setAddress("apt", v)}
                />
                <Field
                  label="City"
                  id="city"
                  value={address.city}
                  onChange={(v) => setAddress("city", v)}
                />
                <Field
                  label="State"
                  id="state"
                  value={address.state}
                  onChange={(v) => setAddress("state", v)}
                />
                <Field
                  label="Zip Code"
                  id="zip"
                  value={address["zip code"]}
                  onChange={(v) => setAddress("zip code", v)}
                />
                <div className="col-span-2">
                  <Field
                    label="Country"
                    id="country"
                    value={address.country}
                    onChange={(v) => setAddress("country", v)}
                  />
                </div>
                <Field
                  label="County"
                  id="county"
                  value={address.county}
                  onChange={(v) => setAddress("county", v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Info */}
        <Card>
          <CardHeader>
            <CardTitle>School Info</CardTitle>
            <CardDescription>Your educational background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd("school info", e)}
            >
              <SortableContext
                items={data["school info"].map((s) => s._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {data["school info"].map((school, i) => (
                    <SortableItem key={school._id} id={school._id}>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Field
                            label="School Name"
                            id={`school-name-${i}`}
                            value={school["school name"]}
                            onChange={(v) => setSchool(i, "school name", v)}
                          />
                        </div>
                        <Field
                          label="Degree"
                          id={`degree-${i}`}
                          value={school.degree}
                          onChange={(v) => setSchool(i, "degree", v)}
                        />
                        <Field
                          label="Major"
                          id={`major-${i}`}
                          value={school.major}
                          onChange={(v) => setSchool(i, "major", v)}
                        />
                        <SelectField
                          label="Start Month"
                          id={`school-start-month-${i}`}
                          value={school["start month"]}
                          onChange={(v) => setSchool(i, "start month", v)}
                          options={OPTIONS.months}
                        />
                        <Field
                          label="Start Year"
                          id={`school-start-year-${i}`}
                          value={school["start year"]}
                          onChange={(v) => setSchool(i, "start year", v)}
                        />
                        <SelectField
                          label="Graduation Month"
                          id={`grad-month-${i}`}
                          value={school["graduation month"]}
                          onChange={(v) => setSchool(i, "graduation month", v)}
                          options={OPTIONS.months}
                        />
                        <Field
                          label="Graduation Year"
                          id={`grad-year-${i}`}
                          value={school["graduation year"]}
                          onChange={(v) => setSchool(i, "graduation year", v)}
                        />
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Button variant="outline" className="w-full" onClick={addSchool}>
              <Plus className="h-4 w-4 mr-2" />
              Add School
            </Button>
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
            <CardDescription>Your work history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd("experience", e)}
            >
              <SortableContext
                items={data.experience.map((e) => e._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {data.experience.map((exp, i) => (
                    <SortableItem key={exp._id} id={exp._id}>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Field
                            label="Job Title"
                            id={`job-title-${i}`}
                            value={exp["job title"]}
                            onChange={(v) => setExp(i, "job title", v)}
                          />
                          <Field
                            label="Company"
                            id={`company-${i}`}
                            value={exp.company}
                            onChange={(v) => setExp(i, "company", v)}
                          />
                          <div className="col-span-2">
                            <Field
                              label="Location"
                              id={`exp-location-${i}`}
                              value={exp.location}
                              onChange={(v) => setExp(i, "location", v)}
                            />
                          </div>
                          <div className="col-span-2">
                            <CheckField
                              label="Current Job"
                              id={`current-job-${i}`}
                              checked={exp["current job"]}
                              onCheckedChange={(v) => setExp(i, "current job", v)}
                            />
                          </div>
                          <SelectField
                            label="Start Month"
                            id={`exp-start-month-${i}`}
                            value={exp["start month"]}
                            onChange={(v) => setExp(i, "start month", v)}
                            options={OPTIONS.months}
                          />
                          <Field
                            label="Start Year"
                            id={`exp-start-year-${i}`}
                            value={exp["start year"]}
                            onChange={(v) => setExp(i, "start year", v)}
                          />
                          {!exp["current job"] && (
                            <>
                              <SelectField
                                label="End Month"
                                id={`exp-end-month-${i}`}
                                value={exp["end month"] ?? ""}
                                onChange={(v) => setExp(i, "end month", v || null)}
                                options={OPTIONS.months}
                              />
                              <Field
                                label="End Year"
                                id={`exp-end-year-${i}`}
                                value={exp["end year"] ?? ""}
                                onChange={(v) => setExp(i, "end year", v || null)}
                              />
                            </>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`role-desc-${i}`}>Role Description</Label>
                          <Textarea
                            id={`role-desc-${i}`}
                            rows={5}
                            value={(exp["role description"] ?? []).join("\n")}
                            onChange={(e) => setRoleDesc(i, e.target.value)}
                            placeholder="One bullet point per line"
                          />
                          <p className="text-xs text-muted-foreground">
                            One bullet point per line
                          </p>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Button variant="outline" className="w-full" onClick={addExperience}>
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle>Languages</CardTitle>
            <CardDescription>Your language proficiencies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd("languages", e)}
            >
              <SortableContext
                items={data.languages.map((l) => l._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {data.languages.map((lang, i) => (
                    <SortableItem key={lang._id} id={lang._id}>
                      <div className="grid grid-cols-2 gap-4">
                        <Field
                          label="Language"
                          id={`lang-${i}`}
                          value={lang.language}
                          onChange={(v) => setLang(i, "language", v)}
                        />
                        <div className="flex items-end pb-1">
                          <CheckField
                            label="Fluent"
                            id={`fluent-${i}`}
                            checked={lang.fluent}
                            onCheckedChange={(v) => setLang(i, "fluent", v)}
                          />
                        </div>
                        <Field
                          label="Proficiency"
                          id={`proficiency-${i}`}
                          value={lang.proficiency}
                          onChange={(v) => setLang(i, "proficiency", v)}
                        />
                        <SelectField
                          label="Reading / Speaking / Writing"
                          id={`rsw-${i}`}
                          value={lang["reading / speaking / writing"]}
                          onChange={(v) =>
                            setLang(i, "reading / speaking / writing", v)
                          }
                          options={OPTIONS.languageLevel}
                        />
                        <SelectField
                          label="Reading"
                          id={`reading-${i}`}
                          value={lang.reading}
                          onChange={(v) => setLang(i, "reading", v)}
                          options={OPTIONS.languageLevel}
                        />
                        <SelectField
                          label="Speaking"
                          id={`speaking-${i}`}
                          value={lang.speaking}
                          onChange={(v) => setLang(i, "speaking", v)}
                          options={OPTIONS.languageLevel}
                        />
                        <SelectField
                          label="Writing"
                          id={`writing-${i}`}
                          value={lang.writing}
                          onChange={(v) => setLang(i, "writing", v)}
                          options={OPTIONS.languageLevel}
                        />
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Button variant="outline" className="w-full" onClick={addLanguage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Language
            </Button>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
            <CardDescription>Your resume and cover letter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AttachmentField
              label="Resume"
              filename={data.attachments.resume}
              onUpload={(name) => handleAttachmentChange("resume", name)}
              onDelete={() => handleAttachmentChange("resume", "")}
              onRename={(name) => handleAttachmentChange("resume", name)}
            />
            <AttachmentField
              label="Cover Letter"
              filename={data.attachments["cover letter"]}
              onUpload={(name) => handleAttachmentChange("cover letter", name)}
              onDelete={() => handleAttachmentChange("cover letter", "")}
              onRename={(name) => handleAttachmentChange("cover letter", name)}
            />
          </CardContent>
        </Card>

        {/* Equal Employment Opportunity */}
        <Card>
          <CardHeader>
            <CardTitle>Equal Employment Opportunity</CardTitle>
            <CardDescription>Voluntary self-identification information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Gender"
                id="gender"
                value={data["equal employment opportunity info"].gender}
                onChange={(v) => setEEO("gender", v)}
                options={OPTIONS.gender}
              />
              <SelectField
                label="Ethnicity"
                id="ethnicity"
                value={data["equal employment opportunity info"].ethnicity}
                onChange={(v) => setEEO("ethnicity", v)}
                options={OPTIONS.ethnicity}
              />
              <SelectField
                label="Race"
                id="race"
                value={data["equal employment opportunity info"].race}
                onChange={(v) => setEEO("race", v)}
                options={OPTIONS.race}
              />
              <SelectField
                label="Veteran Status"
                id="veteran-status"
                value={data["equal employment opportunity info"]["veteran status"]}
                onChange={(v) => setEEO("veteran status", v)}
                options={OPTIONS.veteran}
              />
              <div className="col-span-2">
                <SelectField
                  label="Disability Status"
                  id="disability-status"
                  value={data["equal employment opportunity info"]["disability status"]}
                  onChange={(v) => setEEO("disability status", v)}
                  options={OPTIONS.disability}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Authorization */}
        <Card>
          <CardHeader>
            <CardTitle>Work Authorization</CardTitle>
            <CardDescription>Your right to work information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SelectField
              label="Are you currently authorized to work in the United States?"
              id="work-auth"
              value={
                data["work authorization"][
                  "Are you currently authorized to work in the United States?"
                ]
              }
              onChange={(v) =>
                setWorkAuth(
                  "Are you currently authorized to work in the United States?",
                  v
                )
              }
              options={OPTIONS.yesNo}
            />
            <SelectField
              label="Will you now or in the future require sponsorship for employment visa status (e.g., H-1B visa status)?"
              id="sponsorship"
              value={
                data["work authorization"][
                  "Will you now or in the future require sponsorship for employment visa status (e.g., H-1B visa status)?"
                ]
              }
              onChange={(v) =>
                setWorkAuth(
                  "Will you now or in the future require sponsorship for employment visa status (e.g., H-1B visa status)?",
                  v
                )
              }
              options={OPTIONS.yesNo}
            />
            <Field
              label="Citizenship"
              id="citizenship"
              value={data["work authorization"].citizenship}
              onChange={(v) => setWorkAuth("citizenship", v)}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-10">
          {saved && (
            <p className="text-sm text-muted-foreground">Changes saved.</p>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
