"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const links = [
  { href: "/", label: "Profile" },
  { href: "/apply", label: "Apply" },
  { href: "/applied", label: "Applied" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
        <span className="font-semibold text-sm tracking-tight">AutoApply</span>
        <Separator orientation="vertical" className="h-4" />
        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Button
              key={href}
              variant="ghost"
              size="sm"
              asChild
              className={pathname === href ? "font-semibold" : "text-muted-foreground"}
            >
              <Link href={href}>{label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
