import { readFile } from 'node:fs/promises';

const file = new URL('../product.json', import.meta.url);
let products;
try {
  products = JSON.parse(await readFile(file, 'utf8'));
} catch (error) {
  console.error('Could not read/parse product.json:', error.message);
  process.exit(1);
}
if (!Array.isArray(products)) {
  console.error('product.json must contain an array.');
  process.exit(1);
}

const seenIds = new Map();
const seenSlugs = new Map();
const issues = [];
products.forEach((p, index) => {
  const label = `product at index ${index}`;
  const id = String(p?.id ?? '').trim();
  const slug = String(p?.slug ?? '').trim();
  const price = Number(p?.price);
  if (!id) issues.push(`${label}: missing id`);
  else if (seenIds.has(id)) issues.push(`${label}: duplicate id "${id}" (also index ${seenIds.get(id)})`);
  else seenIds.set(id, index);
  if (!slug) issues.push(`${label} (${id || 'no id'}): missing slug`);
  else if (seenSlugs.has(slug)) issues.push(`${label}: duplicate slug "${slug}" (also index ${seenSlugs.get(slug)})`);
  else seenSlugs.set(slug, index);
  if (!Number.isSafeInteger(price) || price < 0) issues.push(`${label} (${id || 'no id'}): price must be a non-negative whole number in naira`);
  if (!p?.name) issues.push(`${label} (${id || 'no id'}): missing name`);
});

if (issues.length) {
  console.error(`Catalogue validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}
console.log(`Catalogue OK: ${products.length} products; IDs, slugs, names and prices validated.`);
