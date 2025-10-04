import React from "react";
import { cn } from "@/lib/utils";

export type Props = React.HTMLAttributes<HTMLHeadingElement>;

export const H1: React.FC<Props> = ({ className, ...props }) => (
  <h1
    data-slot="h1"
    className={cn(
      "scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance",
      className
    )}
    {...props}
  />
);

export const H2: React.FC<Props> = ({ className, ...props }) => (
  <h2
    data-slot="h2"
    className={cn(
      "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
      className
    )}
    {...props}
  />
);

export const H3: React.FC<Props> = ({ className, ...props }) => (
  <h3
    data-slot="h3"
    className={cn("scroll-m-20 text-2xl font-semibold tracking-tight", className)}
    {...props}
  />
);

export const H4: React.FC<Props> = ({ className, ...props }) => (
  <h4
    data-slot="h4"
    className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)}
    {...props}
  />
);
