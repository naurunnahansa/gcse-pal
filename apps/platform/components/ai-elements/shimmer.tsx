"use client";

import { cn } from "@/lib/utils";
import {
  type CSSProperties,
  type ElementType,
  memo,
  useMemo,
} from "react";

export type TextShimmerProps = {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
};

const ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) => {
  const dynamicSpread = useMemo(
    () => (children?.length ?? 0) * spread,
    [children, spread]
  );

  return (
    <Component
      className={cn(
        "relative inline-block bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent bg-clip-text text-transparent animate-pulse",
        className
      )}
      style={{
        backgroundSize: '200% 100%',
        animation: `shimmer ${duration}s linear infinite`,
      } as CSSProperties}
    >
      {children}
    </Component>
  );
};

export const Shimmer = memo(ShimmerComponent);
