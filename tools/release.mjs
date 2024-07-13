import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourceFile = resolve(process.cwd(), `CHANGELOG.md`);
const targetFile = resolve(process.cwd(), `LOCAL-CHANGELOG.md`);
const docs = await parseChangelog();
const data = [`## What's Changed`];

async function parseChangelog() {
  const content = await readFile(sourceFile, 'utf8');
  const versionMatcher = /^##\s+(\d+\.\d+\.\d+)/gm;
  const currentVersion = versionMatcher.exec(content);
  const previousVersion = versionMatcher.exec(content);
  const start = content.indexOf('\n\n', currentVersion.index) + 2;
  const end = content.lastIndexOf('\n\n', previousVersion.index) - 2;

  const removed = [];
  const updated = [];
  const added = [];
  const others = [];
  const notes = [];

  content
    .substring(start, end)
    .split('\n')
    .filter(Boolean)
    .forEach((line) => {
      if (line.startsWith('- Removed')) {
        removed.push(line);
      } else if (line.startsWith('- Added')) {
        added.push(line);
      } else if (line.startsWith('- Updated')) {
        updated.push(line);
      } else if (line.startsWith('- ')) {
        others.push(line);
      } else {
        notes.push(line);
      }
    });

  return {
    current: currentVersion[1],
    previous: previousVersion[1],
    removed,
    updated,
    added,
    others,
    notes,
  };
}

function addSection(items, title) {
  if (items.length > 0) {
    title && data.push(title);
    data.push(items.join('\n'));
  }
}

addSection(docs.added, `### Added 🚀`);
addSection(docs.updated, `### Updated 🏭`);
addSection(docs.removed, `### Removed 🚦`);
addSection(docs.others, `### Others 🚧`);
addSection(docs.notes, `### Remarks 📯`);

data.push(`**Full Changelog**: https://github.com/picardjs/picard/compare/v${docs.previous}...v${docs.current}`);

await writeFile(targetFile, data.join('\n\n'), 'utf8');
