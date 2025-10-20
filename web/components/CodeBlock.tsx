import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: "json" | "javascript" | "python" | "bash" | "curl";
  title?: string;
  copyable?: boolean;
}

/**
 * Simple syntax highlighting for code blocks
 * Provides color coding for common languages
 */
function getHighlightedCode(code: string, language: string): React.ReactNode[] {
  // For now, return plain text with basic formatting
  // In production, integrate with highlight.js or prism.js
  const lines = code.split("\n");

  return lines.map((line, idx) => (
    <div key={idx} className="flex">
      <span className="w-8 flex-shrink-0 select-none text-right text-slate-500 pr-3 font-mono text-sm">
        {idx + 1}
      </span>
      <span className="flex-1 whitespace-pre-wrap break-words font-mono text-sm text-slate-700">
        {line || " "}
      </span>
    </div>
  ));
}

export function CodeBlock({
  code,
  language = "bash",
  title,
  copyable = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between bg-slate-100 px-4 py-2 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <span className="text-xs text-slate-600 font-mono">{language}</span>
        </div>
      )}

      {/* Code */}
      <div className="overflow-x-auto p-4 bg-white">
        <div className="font-mono text-sm leading-relaxed">
          {getHighlightedCode(code, language)}
        </div>
      </div>

      {/* Copy Button */}
      {copyable && (
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white transition"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Side-by-side code block comparison
 */
interface CodeComparisonProps {
  leftCode: string;
  rightCode: string;
  leftLanguage?: string;
  rightLanguage?: string;
  leftTitle?: string;
  rightTitle?: string;
}

export function CodeComparison({
  leftCode,
  rightCode,
  leftLanguage = "bash",
  rightLanguage = "json",
  leftTitle = "Request",
  rightTitle = "Response",
}: CodeComparisonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CodeBlock
        code={leftCode}
        language={leftLanguage as any}
        title={leftTitle}
        copyable
      />
      <CodeBlock
        code={rightCode}
        language={rightLanguage as any}
        title={rightTitle}
        copyable
      />
    </div>
  );
}

/**
 * Tabbed code blocks (for multi-language examples)
 */
interface TabbedCodeBlockProps {
  examples: {
    label: string;
    code: string;
    language: string;
  }[];
  title?: string;
}

export function TabbedCodeBlock({ examples, title }: TabbedCodeBlockProps) {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <div className="space-y-3">
      {title && <h3 className="font-semibold text-slate-900">{title}</h3>}

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          {examples.map((example, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === idx
                  ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {example.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-x-auto p-4 bg-white">
          <div className="font-mono text-sm leading-relaxed">
            {getHighlightedCode(
              examples[activeTab].code,
              examples[activeTab].language
            )}
          </div>
        </div>

        {/* Copy Button */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(examples[activeTab].code);
              alert("Copied!");
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white transition"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
