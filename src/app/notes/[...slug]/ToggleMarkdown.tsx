// src/app/notes/[...slug]/ToggleMarkdown.tsx
"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const MODES = ["rendered", "raw", "edit"] as const;
type Mode = (typeof MODES)[number];

type Props = { filename: string; content: string };

const markdownComponents: Components = {
  p: ({ children, ...props }) => {
    const items = React.Children.toArray(children);
    if (
      items.length === 1 &&
      React.isValidElement(items[0]) &&
      items[0].type === "pre"
    ) {
      return <>{items}</>;
    }
    return (
      <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-200" {...props}>
        {children}
      </p>
    );
  },

  h1: ({ children, ...props }) => (
    <h1 className="text-4xl font-extrabold mt-10 mb-4 tracking-tight text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h1>
  ),

  h2: ({ children, ...props }) => (
    <h2 className="text-3xl font-bold mt-8 mb-3 tracking-tight text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h2>
  ),

  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:border-gray-700 dark:text-gray-400 mb-4"
      {...props}
    >
      {children}
    </blockquote>
  ),

  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside mb-4 space-y-1 text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </ol>
  ),

  li: ({ children, ...props }) => (
    <li className="ml-4" {...props}>
      {children}
    </li>
  ),

  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="text-blue-500 hover:text-blue-400 transition underline decoration-transparent hover:decoration-blue-400"
      {...props}
    >
      {children}
    </a>
  ),

  code: ({ className, children }) => {
    const isBlock =
      typeof className === "string" && className.startsWith("language-");

    if (!isBlock) {
      return (
        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-sm">
          {children}
        </code>
      );
    }

    return (
      <pre className="bg-gray-950 text-gray-100 p-5 rounded-xl overflow-x-auto font-mono text-sm mb-5 border border-gray-800">
        <code className={className}>{children}</code>
      </pre>
    );
  },

  table: ({ children, ...props }) => (
    <table
      className="table-auto border-collapse border border-gray-300 dark:border-gray-700 mb-4 w-full"
      {...props}
    >
      {children}
    </table>
  ),

  th: ({ children, ...props }) => (
    <th className="border px-3 py-2 bg-gray-100 dark:bg-gray-800 text-left" {...props}>
      {children}
    </th>
  ),

  td: ({ children, ...props }) => (
    <td className="border px-3 py-2" {...props}>
      {children}
    </td>
  ),
};

export default function ToggleMarkdown({ filename, content }: Props) {
  const [mode, setMode] = useState<Mode>("rendered");
  const [editedContent, setEditedContent] = useState(content);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const saveNote = async () => {
    setStatus("saving");
    setErrorMsg("");

    const res = await fetch("/api/edit-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, content: editedContent }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error || "Unknown error");
    } else {
      setStatus("saved");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f17]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {filename}
          </h1>

          <div className="flex gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-sm rounded-md transition border ${
                  mode === m
                    ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white"
                    : "bg-transparent text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {mode === "rendered" && (
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        )}

        {mode === "raw" && (
          <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-950 text-gray-100 border border-gray-800 p-5 rounded-xl overflow-x-auto">
            {content}
          </pre>
        )}

        {mode === "edit" && (
          <div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-[75vh] p-5 font-mono text-sm leading-relaxed bg-gray-950 text-gray-100 border border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40"
            />

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={saveNote}
                disabled={status === "saving"}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition disabled:opacity-50"
              >
                {status === "saving" ? "Saving..." : "Save"}
              </button>

              {status === "saved" && (
                <span className="text-green-500 text-sm">Saved!</span>
              )}

              {status === "error" && (
                <span className="text-red-500 text-sm">{errorMsg}</span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
