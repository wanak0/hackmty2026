import { cn } from "@/lib/utils";

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "warning" | "destructive" | "success";
}) {
  const tones = {
    default: "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    destructive: "border-red-200 bg-red-50 text-red-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-sm",
        tones[variant],
        className,
      )}
      {...props}
    />
  );
}
