"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [launching, setLaunching] = useState(false);

  async function handleLaunch() {
    setLaunching(true);
    try {
      await fetch("/api/launch", { method: "POST" });
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={handleLaunch} disabled={launching}>
        {launching ? "Launching..." : "Launch"}
      </Button>
    </div>
  );
}
