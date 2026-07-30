#!/usr/bin/env node
/**
 * Guards against backticks inside a component's inline styles template literal.
 *
 * A backtick in a CSS comment there silently terminates the string, and the
 * TypeScript errors that follow point everywhere except the real cause. Cheap
 * to check, genuinely hard to diagnose by hand.
 */
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
    // Closing line of the literal, e.g. a lone backtick and comma.
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
