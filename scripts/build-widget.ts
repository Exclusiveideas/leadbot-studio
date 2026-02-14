/**
 * Build script for minifying the chatbot widget
 * Outputs widget.min.js to the public folder
 */
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(__dirname, "..", "public");
const INPUT_FILE = join(PUBLIC_DIR, "widget.js");
const OUTPUT_FILE = join(PUBLIC_DIR, "widget.min.js");

async function buildWidget() {
  console.log("Building widget.min.js...");

  try {
    const result = await build({
      entryPoints: [INPUT_FILE],
      outfile: OUTPUT_FILE,
      bundle: false,
      minify: true,
      sourcemap: false,
      target: ["es2018"],
      format: "iife",
      write: true,
    });

    // Get file sizes for comparison
    const originalSize = readFileSync(INPUT_FILE).length;
    const minifiedSize = readFileSync(OUTPUT_FILE).length;
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

    console.log(`Original:  ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`Minified:  ${(minifiedSize / 1024).toFixed(2)} KB`);
    console.log(`Savings:   ${savings}%`);
    console.log(`Output:    ${OUTPUT_FILE}`);

    if (result.errors.length > 0) {
      console.error("Build errors:", result.errors);
      process.exit(1);
    }

    console.log("Widget build complete!");
  } catch (error) {
    console.error("Failed to build widget:", error);
    process.exit(1);
  }
}

buildWidget();
