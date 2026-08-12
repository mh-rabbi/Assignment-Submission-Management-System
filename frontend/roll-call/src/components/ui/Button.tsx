import React, { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className = "", children, ...props },
    ref
  ) => {
    let variantClass = "btn-primary";
    if (variant === "ghost") variantClass = "btn-ghost";
    if (variant === "danger") variantClass = "btn-danger";

    let sizeClass = "";
    if (size === "lg") sizeClass = "btn-lg";
    if (size === "sm") sizeClass = "btn-sm";

    const combinedClassName = `btn ${variantClass} ${sizeClass} ${className}`.trim();

    return (
      <button ref={ref} className={combinedClassName} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
