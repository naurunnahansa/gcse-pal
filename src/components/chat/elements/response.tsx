"use client";

import { type ComponentProps, memo } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<"div"> & {
  children: string;
};

export const Response = memo(
  ({ className, children, ...props }: ResponseProps) => (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
        className
      )}
      {...props}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
