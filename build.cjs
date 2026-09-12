const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");

esbuild.buildSync({
  entryPoints: ["plasma-background.jsx"],
  bundle: true,
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: "plasma-background.js",
});

// Package only the files served by the landing page.
const outputDirectory = path.join(__dirname, "dist");
fs.mkdirSync(outputDirectory, { recursive: true });
for (const file of ["index.html", "logo-centered.svg", "plasma-background.js"]) {
  fs.copyFileSync(path.join(__dirname, file), path.join(outputDirectory, file));
}
