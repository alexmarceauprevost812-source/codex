"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import c from "react-syntax-highlighter/dist/esm/languages/prism/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import csharp from "react-syntax-highlighter/dist/esm/languages/prism/csharp";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import diff from "react-syntax-highlighter/dist/esm/languages/prism/diff";
import docker from "react-syntax-highlighter/dist/esm/languages/prism/docker";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import graphql from "react-syntax-highlighter/dist/esm/languages/prism/graphql";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import kotlin from "react-syntax-highlighter/dist/esm/languages/prism/kotlin";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import php from "react-syntax-highlighter/dist/esm/languages/prism/php";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import ruby from "react-syntax-highlighter/dist/esm/languages/prism/ruby";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import scss from "react-syntax-highlighter/dist/esm/languages/prism/scss";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import swift from "react-syntax-highlighter/dist/esm/languages/prism/swift";
import toml from "react-syntax-highlighter/dist/esm/languages/prism/toml";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// Register a curated set covering ~95% of dev languages. Aliases keep
// the most common short names working (sh, py, ts, etc.).
const LANGS: Record<string, unknown> = {
  bash,
  sh: bash,
  shell: bash,
  zsh: bash,
  c,
  cpp,
  "c++": cpp,
  cs: csharp,
  csharp,
  css,
  diff,
  patch: diff,
  docker,
  dockerfile: docker,
  go,
  golang: go,
  graphql,
  gql: graphql,
  html: markup,
  xml: markup,
  svg: markup,
  java,
  js: javascript,
  javascript,
  json,
  jsx,
  kotlin,
  kt: kotlin,
  markdown,
  md: markdown,
  markup,
  php,
  py: python,
  python,
  rb: ruby,
  ruby,
  rs: rust,
  rust,
  scss,
  sass: scss,
  sql,
  swift,
  toml,
  ts: typescript,
  tsx,
  typescript,
  yaml,
  yml: yaml,
};

for (const [name, lang] of Object.entries(LANGS)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SyntaxHighlighter.registerLanguage(name, lang as any);
}

/**
 * Renders an assistant message body as Markdown with VS Code-style
 * syntax highlighting on fenced code blocks.
 *
 * The Codex `file:<path>` annotation in the info string (e.g.
 * ```ts file:lib/x.ts) is surfaced as a small header line above the
 * code block so the user can see which file the auto-commit will
 * write. The original raw text still contains the annotation, so
 * `parseFileBlocks` (used by the auto-commit) keeps working unchanged.
 */
export function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="codex-markdown leading-relaxed">
      <ReactMarkdown
        components={{
          code({ className, children, ...rest }) {
            const cls = className ?? "";
            const isBlock = /^language-/.test(cls);
            if (!isBlock) {
              return (
                <code
                  className="rounded-md bg-[var(--soft-surface)] px-1.5 py-[1px] font-mono text-[12.5px] text-[var(--fg)]"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            const langMatch = /language-([\w+-]+)/.exec(cls);
            const language = langMatch?.[1] ?? "text";
            const codeString = String(children).replace(/\n$/, "");
            return (
              <div className="my-3 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[#0a0a0a] shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[11px] text-white/70">
                  <span className="uppercase tracking-wider text-white/50">
                    {language}
                  </span>
                </div>
                <SyntaxHighlighter
                  language={language}
                  style={vscDarkPlus}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: "12px 16px",
                    background: "#0a0a0a",
                    borderRadius: 0,
                    fontSize: "12.5px",
                    lineHeight: 1.55,
                    overflowX: "auto",
                  }}
                  codeTagProps={{
                    style: { fontFamily: "ui-monospace, monospace" },
                  }}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          },

          // The default <pre> would wrap the SyntaxHighlighter in another
          // <pre>, producing invalid nesting. Pass through and let the
          // code component handle its own container.
          pre: ({ children }: { children?: ReactNode }) => <>{children}</>,

          // Headings
          h1: ({ children }) => (
            <h1 className="mt-3 text-lg font-semibold text-[var(--fg)]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 text-base font-semibold text-[var(--fg)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2 text-sm font-semibold text-[var(--fg)]">
              {children}
            </h3>
          ),

          p: ({ children }) => <p className="my-1.5">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--fg)]">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2 hover:decoration-[var(--accent)]"
            >
              {children}
            </a>
          ),

          ul: ({ children }) => (
            <ul className="my-1.5 list-disc space-y-0.5 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1.5 list-decimal space-y-0.5 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="my-0.5">{children}</li>,

          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-[var(--accent)] pl-3 text-[var(--fg-70)]">
              {children}
            </blockquote>
          ),

          hr: () => <hr className="my-3 border-[var(--border-soft)]" />,
        }}
      >
        {preprocessFileAnnotations(text)}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Codex emits fenced code blocks with `lang file:<path>` info strings
 * for auto-commit. Markdown parsers expose only the first word of the
 * info string as the language, so the file path would otherwise be
 * lost at render time. Lift it to a visible header line just above
 * the fence so the user can see which file will be written.
 */
function preprocessFileAnnotations(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const match = /^(\s*)```([A-Za-z0-9_+-]*)\s+file:([^\s`]+)\s*$/.exec(
        line,
      );
      if (!match) return line;
      const [, indent, lang, path] = match;
      return `${indent}**📄 \`${path}\`**\n\n${indent}\`\`\`${lang}`;
    })
    .join("\n");
}
