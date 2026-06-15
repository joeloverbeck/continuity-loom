import ReactMarkdown from "react-markdown";

interface SafeMarkdownProps {
  markdown: string;
}

export function SafeMarkdown({ markdown }: SafeMarkdownProps): React.JSX.Element {
  return (
    <div className="notesMarkdown">
      <ReactMarkdown
        components={{
          a({ children, href }) {
            return (
              <a href={href} rel="noreferrer" target="_blank">
                {children}
              </a>
            );
          },
          img() {
            return null;
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
