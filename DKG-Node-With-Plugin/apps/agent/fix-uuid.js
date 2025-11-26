/**
 * This is a postinstall script required for the project to work.
 * Package 'uuid' that is required by @langchain/core is exporting
 * the .mjs wrapper in a wrong way, unsupported by metro bundler
 * that Expo is using.
 *
 * Hopefully this will be fixed in the next versions of uuid/langchain.
 */

const fs = require("fs");
const path = require("path");

async function fixUuidPackage(filePath) {
  const f = await fs.promises.open(filePath, "r+");
  const buf = await f.readFile({ encoding: "utf8" });

  let didFix = false;
  if (buf.startsWith("import uuid from")) {
    const newContent =
      "import * as uuid from" + buf.substring("import uuid from".length);

    await f.truncate();
    await f.write(newContent, 0, "utf8");
    didFix = true;
  }

  await f.close();
  return didFix;
}

async function findFiles(dir, targetFile) {
  const results = [];
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await findFiles(fullPath, targetFile)));
      } else if (entry.name === targetFile) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Ignore permission errors
  }
  return results;
}

(async () => {
  try {
    const projectRoot = path.join(process.cwd(), "..", "..");
    const nodeModulesPath = path.join(projectRoot, "node_modules");
    
    // Only search in node_modules directories
    const files = await findFiles(nodeModulesPath, "wrapper.mjs");
    
    for (const filePath of files) {
      // Check if this is a uuid package wrapper
      if (filePath.includes(path.join("uuid", "wrapper.mjs"))) {
        const fixed = await fixUuidPackage(filePath);
        if (fixed) {
          console.log(`Fixed uuid package at '${filePath}' successfully.`);
        }
      }
    }
    process.exit(0);
  } catch (error) {
    console.error("Fixing uuid packages failed: ", error);
    process.exit(1);
  }
})();
