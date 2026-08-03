import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.css";

type Variant = "primary" | "accent" | "ghost" | "danger";

const variantClass: Record<Variant, string> = {
  primary: styles.primary,
  accent: styles.accent,
  ghost: styles.ghost,
  danger: styles.danger,
};

type BaseProps = {
  variant?: Variant;
  full?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  href: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "primary",
  full,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = `${styles.button} ${variantClass[variant]} ${full ? styles.full : ""} ${className ?? ""}`;

  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link href={rest.href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
