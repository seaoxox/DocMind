import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';
import { extToDocType, uid } from '../lib/utils';
import type { AppDocument, DocCategory } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pages.push(text);
  }
  return pages.join('\n\n');
}

async function parseDocx(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

/** Parse a File object (from <input type=file> or drag/drop) into an AppDocument */
export async function parseFile(file: File, category: DocCategory): Promise<AppDocument> {
  const type = extToDocType(file.name);
  let content = '';

  if (type === 'word') {
    content = await parseDocx(await file.arrayBuffer());
  } else if (type === 'pdf') {
    content = await parsePdf(await file.arrayBuffer());
  } else if (type === 'markdown' || type === 'text') {
    content = await file.text();
  } else {
    // best effort: try reading as text
    content = await file.text();
  }

  return {
    id: uid('doc'),
    name: file.name,
    content,
    type,
    category,
    builtIn: false,
    sizeChars: content.length,
  };
}

/** Fetch + parse a built-in file (served as a static asset next to index.html) */
export async function parseFromUrl(
  url: string,
  name: string,
  category: DocCategory
): Promise<AppDocument> {
  const type = extToDocType(name);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`無法載入內建文件: ${name} (${res.status})`);

  let content = '';
  if (type === 'word') {
    content = await parseDocx(await res.arrayBuffer());
  } else if (type === 'pdf') {
    content = await parsePdf(await res.arrayBuffer());
  } else {
    content = await res.text();
  }

  return {
    id: uid('doc'),
    name,
    content,
    type,
    category,
    builtIn: true,
    sizeChars: content.length,
  };
}
