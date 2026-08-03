#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src';
const problems = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (path.endsWith('.ts') && !path.endsWith('.spec.ts')) {
      check(path);
    }
  }
}

function check(path) {
  const lines = readFileSync(path, 'utf8').split('\n');
  let inside = false;

  for (const [i, line] of lines.entries()) {
    if (!inside) {
      if (/\bstyles:\s*`/.test(line)) inside = true;
      continue;
    }
    if (/^\s*`,?\s*$/.test(line)) {
      inside = false;
      continue;
    }
    if (line.includes('`')) {
      problems.push(`${path}:${i + 1}\n    ${line.trim()}`);
    }
  }
}

walk(ROOT);

if (problems.length) {
  console.error('Backtick inside an inline styles block:\n');
  console.error(problems.join('\n'));
  console.error('\nRewrite the comment without backticks.');
  process.exit(1);
}

console.log('Inline styles clean.');
