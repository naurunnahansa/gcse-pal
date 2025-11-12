"use client";

import { X } from "lucide-react";
import { useState } from "react";

const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative border-b border-border/40 bg-background">
      <div className="container flex items-center justify-center gap-3 py-3">
        <span className="inline-flex items-center gap-2 text-sm">
          <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground crayon-noise">
            New
          </span>
          <span className="text-muted-foreground">
            Introducing AI-powered GCSE study support for better exam results
          </span>
          <span className="text-primary crayon-text">→</span>
        </span>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 rounded-md p-1 transition-colors hover:bg-secondary"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;