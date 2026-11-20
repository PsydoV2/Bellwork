import { renderAppIcon } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so a full-bleed square is what it wants.
export default function AppleIcon() {
  return renderAppIcon(180);
}
