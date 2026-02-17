"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

/**
 * Custom sanitization schema for AI response content.
 * Extends the default schema to allow safe HTML elements for rich formatting
 * while blocking potentially dangerous elements like scripts and event handlers.
 */
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "mark", "del", "ins"],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    pre: [...(defaultSchema.attributes?.pre ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
  },
};

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  try {
    const components: Components = {
      h1: ({ children }) => <h1>{children}</h1>,
      h2: ({ children }) => <h2>{children}</h2>,
      h3: ({ children }) => <h3>{children}</h3>,
      h4: ({ children }) => <h4>{children}</h4>,
      h5: ({ children }) => <h5>{children}</h5>,
      h6: ({ children }) => <h6>{children}</h6>,
      p: ({ children }) => <p>{children}</p>,
      ul: ({ children }) => <ul>{children}</ul>,
      ol: ({ children }) => <ol>{children}</ol>,
      li: ({ children }) => <li>{children}</li>,
      code: ({ className, children }) => {
        const isInline = !className;
        const match = /language-(\w+)/.exec(className || "");
        const language = match ? match[1] : undefined;

        if (isInline) {
          return <code className="inline-code">{children}</code>;
        }

        return (
          <code
            className={className}
            aria-label={language ? `Code in ${language}` : "Code block"}
          >
            {children}
          </code>
        );
      },
      pre: ({ children }) => (
        <pre className="markdown-code-block">{children}</pre>
      ),
      a: ({ href, children }) => {
        const childText =
          typeof children === "string" ? children : "Link opens in new tab";
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${childText} (opens in new tab)`}
          >
            {children}
          </a>
        );
      },
      blockquote: ({ children }) => <blockquote>{children}</blockquote>,
      table: ({ children }) => (
        <div className="table-wrapper">
          <table>{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead>{children}</thead>,
      tbody: ({ children }) => <tbody>{children}</tbody>,
      tr: ({ children }) => <tr>{children}</tr>,
      th: ({ children }) => <th scope="col">{children}</th>,
      td: ({ children }) => <td>{children}</td>,
      hr: () => <hr />,
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      del: ({ children }) => <del>{children}</del>,
      input: (props) => (
        <input
          type="checkbox"
          disabled
          aria-readonly="true"
          aria-label="Task list item checkbox"
          {...props}
        />
      ),
    };

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, sanitizeSchema],
          rehypeHighlight,
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    );
  } catch (error) {
    console.error("Failed to render markdown:", error);
    return (
      <div className="text-red-600 p-4 rounded-lg bg-red-50 border border-red-200">
        <p className="font-semibold mb-1">Failed to render markdown</p>
        <p className="text-sm">
          The message content could not be properly formatted.
        </p>
      </div>
    );
  }
}
