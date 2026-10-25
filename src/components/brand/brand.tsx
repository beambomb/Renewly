import Link from "next/link";
import { strings } from "@/lib/strings";
import { LogoMark } from "./logo-mark";

const SIZES = {
  sm: { mark: "size-6", text: "text-lg" },
  md: { mark: "size-8", text: "text-xl" },
  lg: { mark: "size-10", text: "text-2xl" },
} as const;

type BrandProps = {
  size?: keyof typeof SIZES;
  /** Renders the lockup as a link (e.g. "/"); otherwise a plain element. */
  href?: string;
  className?: string;
};

export function Brand({ size = "md", href, className = "" }: BrandProps) {
  const { mark, text } = SIZES[size];
  const classes = `inline-flex min-h-11 items-center gap-2 font-semibold tracking-tight text-foreground ${text} ${className}`.trim();
  const content = (
    <>
      <LogoMark className={`${mark} shrink-0 text-foreground`} />
      <span>{strings.app.name}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return <span className={classes}>{content}</span>;
}
