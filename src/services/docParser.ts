import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';
import { extToDocType, uid } from '../lib/utils';
import type { AppDocument, ContentBlock, DocCategory } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const HEADING_TAG = /^H([1-6])$/i;

/**
 * Walks Word's converted HTML (headings, paragraphs, list items) in document order,
 * tracking which heading each block currently falls under. This preserves the document's
 * real structure — which mammoth's plain-text extraction throws away — so chunking can
 * respect section boundaries instead of guessing from blank lines.
 */
function blocksFromHtml(html: string): ContentBlock[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: ContentBlock[] = [];
  const headingStack: string[] = [];

  const pushBlock = (text: string) => {
    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (trimmed) blocks.push({ headingPath: [...headingStack], text: trimmed });
  };

  const walk = (el: Element) => {
    const headingMatch = el.tagName.match(HEADING_TAG);
    if (headingMatch) {
      const level = Number(headingMatch[1]);
      headingStack.length = Math.max(0, level - 1);
      const title = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (title) headingStack[level - 1] = title;
      return;
    }

    if (el.tagName === 'UL' || el.tagName === 'OL') {
      for (const li of Array.from(el.children)) {
        if (li.tagName === 'LI') pushBlock(li.textContent ?? '');
      }
      return;
    }

    if (el.tagName === 'P' || el.tagName === 'TABLE') {
      pushBlock(el.textContent ?? '');
      return;
    }

    // Unknown/wrapper element: recurse into children rather than dropping the content.
    for (const child of Array.from(el.children)) walk(child);
  };

  for (const child of Array.from(doc.body.children)) walk(child);
  return blocks;
}

async function parseDocxStructured(buffer: ArrayBuffer): Promise<ContentBlock[]> {
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  return blocksFromHtml(result.value);
}

/** Parses Markdown headings (# .. ######) into a heading path, one block per paragraph. */
function blocksFromMarkdown(text: string): ContentBlock[] {
  const headingStack: string[] = [];
  const blocks: ContentBlock[] = [];
  const paragraphs = text.replace(/\r\n/g, '\n').split(/\n{2,}/);

  for (const para of paragraphs) {
    const lines = para.split('\n');
    const bodyLines: string[] = [];
    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        headingStack.length = Math.max(0, level - 1);
        headingStack[level - 1] = headingMatch[2].trim();
      } else if (line.trim()) {
        bodyLines.push(line.trim());
      }
    }
    const body = bodyLines.join(' ').trim();
    if (body) blocks.push({ headingPath: [...headingStack], text: body });
  }
  return blocks;
}

/** Fallback for formats without structural markup (PDF, plain text): split on blank lines. */
function blocksFromPlainText(text: string): ContentBlock[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ headingPath: [], text: p }));
}

async function parsePdfBlocks(buffer: ArrayBuffer): Promise<ContentBlock[]> {
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pages.push(text);
  }
  return blocksFromPlainText(pages.join('\n\n'));
}

function flattenBlocks(blocks: ContentBlock[]): string {
  return blocks.map((b) => b.text).join('\n\n');
}

/** Fetch + parse a bundled file (served as a static asset next to index.html). */
export async function parseFromUrl(url: string, name: string, category: DocCategory): Promise<AppDocument> {
  const type = extToDocType(name);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`無法載入文件: ${name} (${res.status})`);

  let blocks: ContentBlock[];
  if (type === 'word') {
    blocks = await parseDocxStructured(await res.arrayBuffer());
  } else if (type === 'pdf') {
    blocks = await parsePdfBlocks(await res.arrayBuffer());
  } else if (type === 'markdown') {
    blocks = blocksFromMarkdown(await res.text());
  } else {
    blocks = blocksFromPlainText(await res.text());
  }

  const content = flattenBlocks(blocks);

  return {
    id: uid('doc'),
    name,
    content,
    blocks,
    type,
    category,
    sizeChars: content.length,
  };
}
