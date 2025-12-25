import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-foreground" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-xl font-semibold mb-3 mt-5 text-foreground" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground" {...props} />
          ),
          h4: ({ ...props }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 text-foreground" {...props} />
          ),
          h5: ({ ...props }) => (
            <h5 className="text-sm font-semibold mb-2 mt-3 text-foreground" {...props} />
          ),
          h6: ({ ...props }) => (
            <h6 className="text-xs font-semibold mb-2 mt-3 text-foreground" {...props} />
          ),
          p: ({ ...props }) => (
            <p className="mb-3 leading-relaxed text-foreground" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 ml-0" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 ml-0" {...props} />
          ),
          li: ({ ...props }) => (
            <li className="ml-4 text-foreground" {...props} />
          ),
          strong: ({ ...props }) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),
          em: ({ ...props }) => (
            <em className="italic text-foreground" {...props} />
          ),
          a: ({ ...props }) => (
            <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          code: ({ className, ...props }: any) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props} />
            ) : (
              <code className={className} {...props} />
            );
          },
          pre: ({ ...props }) => (
            <pre className="bg-muted p-4 rounded-lg mb-4 overflow-x-auto" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground" {...props} />
          ),
          hr: ({ ...props }) => (
            <hr className="my-6 border-border" {...props} />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border" {...props} />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead className="bg-muted" {...props} />
          ),
          tbody: ({ ...props }) => (
            <tbody {...props} />
          ),
          tr: ({ ...props }) => (
            <tr className="border-b border-border" {...props} />
          ),
          th: ({ ...props }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="border border-border px-4 py-2 text-foreground" {...props} />
          ),
          img: ({ ...props }) => (
            <img className="max-w-full h-auto rounded-lg my-4" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

