import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div className="overflow-hidden max-w-full min-w-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className={`${className} break-words max-w-full`}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-3 mt-2 text-foreground break-words">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mt-6 mb-3 first:mt-0 border-b border-zinc-100 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-2 mt-2 text-foreground break-words">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mb-1 mt-2 text-foreground break-words">
              {children}
            </h4>
          ),

          // Paragraphs - Better spacing
          p: ({ children }) => (
            <p className="mb-4 text-sm leading-relaxed text-zinc-700 break-words last:mb-0">
              {children}
            </p>
          ),

          // Lists - Better spacing and alignment
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 mb-4 space-y-2 text-sm text-zinc-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 mb-4 space-y-2 text-sm text-zinc-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-zinc-700 leading-relaxed pl-1">
              {children}
            </li>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4 max-w-full w-full">
              <table className="w-full divide-y divide-border border border-border rounded-lg text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border bg-card">{children}</tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs text-foreground max-w-xs break-words">
              {children}
            </td>
          ),

          // Code blocks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: ({ inline, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs break-words max-w-full"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="block p-3 rounded-lg bg-muted text-foreground font-mono text-xs overflow-x-auto mb-3 max-w-full w-full"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto max-w-full w-full">
              {children}
            </pre>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="my-4 border-border" />,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),

          // Strong/Bold - Inline emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900">
              {children}
            </strong>
          ),

          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic text-foreground">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
