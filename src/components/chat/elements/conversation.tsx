"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ConversationProps = HTMLAttributes<HTMLDivElement>;

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <div
    className={cn(
      "relative flex-1 touch-pan-y overflow-y-auto will-change-scroll",
      className
    )}
    role="log"
    {...props}
  />
);

export type ConversationContentProps = HTMLAttributes<HTMLDivElement>;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <div className={cn("p-4", className)} {...props} />
);
