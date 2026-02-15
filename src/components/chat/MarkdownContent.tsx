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
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    // Add any additional safe tags needed for markdown rendering
    "mark",
    "del",
    "ins",
  ],
  attributes: {
    ...defaultSchema.attributes,
    // Allow class for syntax highlighting
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
      // Headings with better spacing
      h1: ({ children }) => (
        <h1 className="text-2xl font-bold mt-6 mb-3 text-gray-900 border-b border-gray-200 pb-2 first:mt-0">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-xl font-bold mt-5 mb-2 text-gray-900 border-b border-gray-200 pb-2">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900">
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="text-base font-semibold mt-3 mb-2 text-gray-900">
          {children}
        </h4>
      ),
      h5: ({ children }) => (
        <h5 className="text-sm font-semibold mt-3 mb-2 text-gray-900">
          {children}
        </h5>
      ),
      h6: ({ children }) => (
        <h6 className="text-sm font-semibold mt-3 mb-2 text-gray-600">
          {children}
        </h6>
      ),

      // Paragraphs with better spacing
      p: ({ children }) => (
        <p className="mb-4 leading-7 text-gray-900 last:mb-0">{children}</p>
      ),

      // Lists with improved spacing
      ul: ({ children }) => (
        <ul className="list-disc list-outside ml-6 mb-4 space-y-1 text-gray-900">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-outside ml-6 mb-4 space-y-1 text-gray-900">
          {children}
        </ol>
      ),
      li: ({ children }) => <li className="leading-6">{children}</li>,

      // Code - inline and blocks
      code: ({ className, children }) => {
        const isInline = !className;
        const match = /language-(\w+)/.exec(className || "");
        const language = match ? match[1] : undefined;

        if (isInline) {
          return (
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900 border border-gray-200">
              {children}
            </code>
          );
        }

        return (
          <code
            className={className}
            aria-label={language ? `Code in ${language}` : "Code block"}
            style={{ fontSize: "0.875rem" }}
          >
            {children}
          </code>
        );
      },
      pre: ({ children }) => (
        <pre className="markdown-code-block p-4 rounded-lg overflow-x-auto mb-4 border border-gray-200 bg-gray-50">
          {children}
        </pre>
      ),

      // Links with security and accessibility
      a: ({ href, children }) => {
        const childText =
          typeof children === "string" ? children : "Link opens in new tab";
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue hover:text-brand-blue/80 hover:underline font-medium transition-colors"
            aria-label={`${childText} (opens in new tab)`}
          >
            {children}
          </a>
        );
      },

      // Blockquotes with background
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-brand-blue pl-4 py-1 mb-4 italic text-brand-secondary bg-brand-blue/5 rounded-r">
          {children}
        </blockquote>
      ),

      // Tables with better styling
      table: ({ children }) => (
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border-collapse border border-gray-200">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
      tbody: ({ children }) => <tbody>{children}</tbody>,
      tr: ({ children }) => (
        <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
          {children}
        </tr>
      ),
      th: ({ children }) => (
        <th
          scope="col"
          className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-900"
        >
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="border border-gray-200 px-4 py-2 text-gray-900">
          {children}
        </td>
      ),

      // Horizontal Rule
      hr: () => <hr className="my-12 border-t-2 border-gray-300" />,

      // Emphasis
      strong: ({ children }) => (
        <strong className="font-bold text-gray-900">{children}</strong>
      ),
      em: ({ children }) => (
        <em className="italic text-gray-900">{children}</em>
      ),

      // Strikethrough (from GFM)
      del: ({ children }) => (
        <del className="line-through text-gray-600">{children}</del>
      ),

      // Task lists (from GFM)
      input: (props) => (
        <input
          type="checkbox"
          disabled
          aria-readonly="true"
          aria-label="Task list item checkbox"
          className="mr-2 align-middle"
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
