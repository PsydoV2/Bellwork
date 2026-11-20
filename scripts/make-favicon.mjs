/**
 * Builds src/app/favicon.ico (16, 32 and 48 px, PNG-compressed) from src/app/icon.svg.
 * Run after changing the icon:  node scripts/make-favicon.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

const svg = await readFile(new URL("../src/app/icon.svg", import.meta.url), "utf8");
const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

const sizes = [16, 32, 48];
const pngs = await Promise.all(
  sizes.map(async (size) => {
    const res = new ImageResponse(
      h("div", { style: { width: "100%", height: "100%", display: "flex" } }, h("img", { src, width: size, height: size })),
      { width: size, height: size },
    );
    return Buffer.from(await res.arrayBuffer());
  }),
);

// ICO container: 6-byte header, 16-byte directory entry per image, then the PNG data
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((size, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size >= 256 ? 0 : size, 0);
  e.writeUInt8(size >= 256 ? 0 : size, 1);
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // colour planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});

await writeFile(new URL("../src/app/favicon.ico", import.meta.url), Buffer.concat([header, ...entries, ...pngs]));
console.log(`favicon.ico written (${sizes.join(", ")} px)`);
