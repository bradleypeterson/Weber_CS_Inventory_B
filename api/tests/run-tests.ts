import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TEST_FILE_PATTERN = /^run-.*-tests\.ts$/;
const TESTS_DIR = __dirname;

function discoverTestFiles() {
  return fs
    .readdirSync(TESTS_DIR)
    .filter((fileName) => TEST_FILE_PATTERN.test(fileName))
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => path.join(TESTS_DIR, fileName));
}

function runTestFile(filePath: string) {
  console.log(`\nRunning ${path.basename(filePath)}...`);

  const result = spawnSync(process.execPath, ["-r", "ts-node/register", filePath], {
    stdio: "inherit",
    env: process.env
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function run() {
  const files = discoverTestFiles();
  if (files.length === 0) {
    console.error("No test files were discovered in api/tests.");
    process.exit(1);
  }

  files.forEach(runTestFile);
  console.log("\nAll discovered API test files passed.");
}

run();
