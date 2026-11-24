import * as cheerio from 'cheerio';
import { readFile } from 'node:fs/promises';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export function htmlToText(html: string) {
  const $ = cheerio.load(html);
  $('script,style,noscript,svg,iframe,nav,footer,header,form').remove();
  const title = $('title').text().trim();
  const text = $('main').length ? $('main').text() : $('body').text();
  return { title, text: text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim() };
}

export function sameSiteLinks(html: string, base: string): string[] {
  const $ = cheerio.load(html);
  const origin = new URL(base).origin;
  const links = new Set<string>();
  $('a[href]').each((_, a) => {
    try {
      const u = new URL($(a).attr('href')!, base);
      u.hash = '';
      if (u.origin === origin && !/\.(png|jpe?g|gif|svg|pdf|zip|mp4|css|js)$/i.test(u.pathname)) links.add(u.toString());
    } catch { /* ignore bad href */ }
  });
  return [...links];
}

export async function fileToText(path: string, originalName: string) {
  const buf = await readFile(path);
  if (/\.pdf$/i.test(originalName)) return (await pdf(buf)).text;
  if (/\.docx$/i.test(originalName)) return (await mammoth.extractRawText({ buffer: buf })).value;
  return buf.toString('utf8');
}
