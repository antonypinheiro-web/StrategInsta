import React from 'react';

// Render generated text as escaped React nodes. Never execute raw HTML or URLs.
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*)/g).map((part, i) => {
    if (/^(\*\*|__)/.test(part)) return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <span key={i} className="rounded bg-muted px-1">{part.slice(1, -1)}</span>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export function StrategyText({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || /^```/.test(line)) continue;
    if (/^([-*_])\1{2,}$/.test(line)) {
      blocks.push(<hr key={i} className="my-6 border-border" />);
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/) ?? line.match(/^\*\*(.+)\*\*$/);
    if (heading) {
      blocks.push(<h3 key={i} className="mb-3 mt-7 border-b border-border pb-3 text-lg font-semibold leading-snug text-foreground first:mt-0">{inline(heading[1])}</h3>);
      continue;
    }
    if (line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? '')) {
      const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
      const headers = cells(line);
      const rows: string[][] = [];
      const key = i;
      i += 1;
      while (i + 1 < lines.length && lines[i + 1].includes('|')) rows.push(cells(lines[++i]));
      blocks.push(<div key={key} className="my-5 max-w-full overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted/60"><tr>{headers.map((cell, index) => <th key={index} className="p-3 font-semibold">{inline(cell)}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-border">{row.map((cell, col) => <td key={col} className="p-3 align-top">{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^([-*+]\s+|\d+[.)]\s+)/.test(line)) {
      const ordered = /^\d/.test(line);
      const list: React.ReactNode[] = [];
      const key = i;
      const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/;
      while (i < lines.length && pattern.test(lines[i].trim())) {
        list.push(<li key={i} className="pl-1">{inline(lines[i].trim().replace(pattern, ''))}</li>);
        i++;
      }
      i--;
      blocks.push(ordered ? <ol key={key} className="my-3 list-decimal space-y-2 pl-6">{list}</ol> : <ul key={key} className="my-3 list-disc space-y-2 pl-5 marker:text-primary">{list}</ul>);
      continue;
    }
    blocks.push(<p key={i} className="my-3 whitespace-pre-wrap">{inline(line.replace(/^>\s?/, ''))}</p>);
  }
  return <div className="min-w-0 break-words text-sm leading-7 text-foreground/80 sm:text-base">{blocks}</div>;
}
