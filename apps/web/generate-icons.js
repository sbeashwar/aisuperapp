const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "public", "icons");
const svg = fs.readFileSync(path.join(iconsDir, "icon-192.svg"), "utf-8");

// Create 512 SVG variant
const svg512 = svg
  .replace('width="192"', 'width="512"')
  .replace('height="192"', 'height="512"');
fs.writeFileSync(path.join(iconsDir, "icon-512.svg"), svg512);

console.log("Created icon-512.svg");
console.log("Icons are SVGs — updating manifest to use SVG format");
