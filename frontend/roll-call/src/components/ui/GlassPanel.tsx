import React, { forwardRef } from "react";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "standard" | "muted" | "app";
  children: React.ReactNode;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    { variant = "standard", className = "", children, ...props },
    ref
  ) => {
    let variantClass = "glass";
    if (variant === "muted") variantClass = "glass-muted";
    if (variant === "app") variantClass = "glass-app";

    const combinedClassName = `${variantClass} ${className}`.trim();

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";
