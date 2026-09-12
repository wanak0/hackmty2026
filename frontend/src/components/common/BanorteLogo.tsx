interface BanorteLogoProps {
  className?: string;
  variant?: "white" | "red" | "dark";
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function BanorteLogo({
  className = "",
  variant = "red",
  showText = true,
  size = "md",
}: BanorteLogoProps) {
  return (
    <img
      src={showText ? "/banorte-wordmark.svg" : "/banorte-logo.png"}
      alt="Banorte"
      className={`banorte-logo logo-${size} ${variant === "white" ? "logo-white" : ""} ${className}`}
    />
  );
}
