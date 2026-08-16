import type { ReactNode } from "react";

const SAFE_PROTOCOL = /^(https?:|mailto:)/i;

/**
 * Renders a small markdown subset as React nodes — never via HTML string injection.
 * Supports: **bold**, *italic* / _italic_, [label](url), and newlines.
 */
export function SafeMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  return (
    <div className="whitespace-pre-wrap break-words [&_a]:underline">
      {lines.map((line, lineIndex) => (
        <span key={`l-${lineIndex}`}>
          {lineIndex > 0 ? <br /> : null}
          {renderInline(line)}
        </span>
      ))}
    </div>
  );
}

function renderInline(input: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > last) {
      nodes.push(input.slice(last, match.index));
    }

    if (match[2] != null) {
      nodes.push(<strong key={`b-${key}`}>{match[2]}</strong>);
    } else if (match[3] != null) {
      nodes.push(<em key={`i-${key}`}>{match[3]}</em>);
    } else if (match[4] != null) {
      nodes.push(<em key={`i-${key}`}>{match[4]}</em>);
    } else if (match[5] != null && match[6] != null) {
      const href = match[6].trim();
      if (SAFE_PROTOCOL.test(href)) {
        nodes.push(
          <a
            key={`a-${key}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {match[5]}
          </a>,
        );
      } else {
        nodes.push(match[0]);
      }
    }

    key += 1;
    last = match.index + match[0].length;
  }

  if (last < input.length) {
    nodes.push(input.slice(last));
  }

  return nodes;
}
