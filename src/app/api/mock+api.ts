/// <reference types="node" />

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { parseBackup, serializeBackup } from '@/lib/backup';

// Dev-only endpoint: saves the wallet as a fixture in the repo (and reads it back), so real data
// can be restored or reused later. The dev server runs from the project root.
const MOCK_FILE = 'src/mocks/holdings.json';
const MOCK_PATH = path.join(process.cwd(), MOCK_FILE);

const notFound = () => new Response('Not found', { status: 404 });
const isProduction = process.env.NODE_ENV === 'production';

export async function GET() {
  if (isProduction) return notFound();
  try {
    const text = await readFile(MOCK_PATH, 'utf8');
    return new Response(text, { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return Response.json({ error: `Файл ${MOCK_FILE} ще не створено` }, { status: 404 });
  }
}

export async function POST(request: Request) {
  if (isProduction) return notFound();
  let holdings;
  try {
    holdings = parseBackup(await request.text());
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
  await mkdir(path.dirname(MOCK_PATH), { recursive: true });
  await writeFile(MOCK_PATH, `${serializeBackup(holdings)}\n`);
  return Response.json({ file: MOCK_FILE, count: holdings.length });
}
