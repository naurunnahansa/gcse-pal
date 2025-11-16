"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Element } from "hast";
import { CheckIcon, CopyIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Highlight, themes } from "prism-react-renderer";

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
};

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export function highlightCode(
  code: string,
  language: string,
  showLineNumbers = false
) {
  // Prism renderer handles highlighting differently, this is just for compatibility
  return { code, language, showLineNumbers };
}

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          "group relative w-full overflow-hidden rounded-md border bg-background text-foreground",
          className
        )}
        {...props}
      >
        <div className="relative">
          <Highlight
            theme={themes.vsLight}
            code={code}
            language={language as any}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={cn(
                  "m-0 bg-background! p-4 text-foreground! text-sm font-mono text-sm overflow-x-auto dark:hidden",
                  className
                )}
                style={style}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {showLineNumbers && (
                      <span className="inline-block min-w-10 mr-4 text-right select-none text-muted-foreground">
                        {i + 1}
                      </span>
                    )}
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
          <Highlight
            theme={themes.vsDark}
            code={code}
            language={language as any}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={cn(
                  "hidden m-0 bg-background! p-4 text-foreground! text-sm font-mono text-sm overflow-x-auto dark:block",
                  className
                )}
                style={style}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {showLineNumbers && (
                      <span className="inline-block min-w-10 mr-4 text-right select-none text-muted-foreground">
                        {i + 1}
                      </span>
                    )}
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
          {children && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn("shrink-0", className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};
