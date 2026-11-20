import { renderAppIcon } from "@/lib/app-icon";

// prerendered to a static file at build time (required for `output: "export"`)
export const dynamic = "force-static";

export function GET() {
  return renderAppIcon(512, { maskable: true });
}
