'use client';

import { useState, type ReactElement } from "react";
import { Check, Link as LinkIcon, Share2, Twitter, Linkedin } from "lucide-react";

import { Button } from "@/components/ui/button";

type ShareButtonsProps = {
  title: string;
  url: string;
};

function buildShareUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

export function ShareButtons({ title, url }: ShareButtonsProps): ReactElement {
  const [copied, setCopied] = useState(false);

  const encodedTitle = title.trim().length ? title : "India Inflation insights";

  const xUrl = buildShareUrl("https://twitter.com/intent/tweet", {
    text: encodedTitle,
    url
  });
  const linkedinUrl = buildShareUrl("https://www.linkedin.com/sharing/share-offsite/", {
    url
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={xUrl} target="_blank" rel="noopener noreferrer">
          <Twitter className="mr-2 h-4 w-4" /> Share on X
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
          <Linkedin className="mr-2 h-4 w-4" /> Share on LinkedIn
        </a>
      </Button>
      <Button variant="ghost" size="sm" onClick={handleCopy} aria-live="polite">
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" /> Copied
          </>
        ) : (
          <>
            <LinkIcon className="mr-2 h-4 w-4" /> Copy link
          </>
        )}
      </Button>
      <span className="flex items-center text-xs font-medium uppercase tracking-wide text-slate-400">
        <Share2 className="mr-1 h-3.5 w-3.5" /> Share
      </span>
    </div>
  );
}
