import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const root = process.cwd();
const sourcePath = resolve(root, "docs/MOMENTUS_CODEBASE_BLUEPRINT.md");
const outputPath = resolve(root, "docs/MOMENTUS_CODEBASE_BLUEPRINT.pdf");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|[^\s)]+)\)/g,
    '<a href="$2">$1</a>',
  );
  return text;
}

function renderMarkdown(markdown) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const html = [];
  let paragraph = [];
  let listKind = null;
  let tableRows = [];
  let codeLines = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (!listKind) return;
    const tag = listKind === "ordered" ? "ol" : "ul";
    html.push(
      `<${tag}>${paragraph.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${tag}>`,
    );
    paragraph = [];
    listKind = null;
  };
  const flushTable = () => {
    if (!tableRows.length) return;
    const rows = tableRows.filter(
      (row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell.trim())),
    );
    const [header, ...body] = rows;
    html.push(
      `<table><thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
    );
    tableRows = [];
  };

  for (const line of lines) {
    if (codeLines) {
      if (line.startsWith("```")) {
        html.push(
          `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
        );
        codeLines = null;
      } else codeLines.push(line);
      continue;
    }
    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      flushTable();
      codeLines = [];
      continue;
    }

    const isTable = /^\s*\|.*\|\s*$/.test(line);
    if (isTable) {
      flushParagraph();
      flushList();
      tableRows.push(
        line
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim()),
      );
      continue;
    }
    flushTable();

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    if (/^\s*---+\s*$/.test(line)) {
      flushParagraph();
      flushList();
      html.push("<hr>");
      continue;
    }
    const unordered = /^\s*-\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+\.\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      const nextKind = unordered ? "unordered" : "ordered";
      if (listKind && listKind !== nextKind) flushList();
      listKind = nextKind;
      paragraph.push((unordered ?? ordered)[1]);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  flushTable();
  if (codeLines)
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  return html.join("\n");
}

const markdown = await readFile(sourcePath, "utf8");
const body = renderMarkdown(markdown);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1600 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
      * { box-sizing: border-box; }
      html { color: #23332d; background: #fff; font-family: Aptos, "Segoe UI", Arial, sans-serif; }
      body { font-size: 10.2pt; line-height: 1.48; }
      h1 { color: #244c3f; font-family: Georgia, serif; font-size: 29pt; line-height: 1.12; margin: 0 0 16pt; padding-bottom: 12pt; border-bottom: 3pt solid #b99158; }
      h2 { color: #244c3f; font-family: Georgia, serif; font-size: 17pt; margin: 23pt 0 8pt; break-after: avoid; }
      h3 { color: #466655; font-size: 11.5pt; margin: 15pt 0 5pt; break-after: avoid; }
      p { margin: 5pt 0 9pt; orphans: 3; widows: 3; }
      strong { color: #223d33; }
      a { color: #3b6752; text-decoration: none; }
      code { font-family: Consolas, "Courier New", monospace; font-size: 8.6pt; color: #315443; background: #f1f5f2; padding: 1pt 3pt; border-radius: 2pt; }
      pre { white-space: pre-wrap; background: #f2f5f3; border-left: 3pt solid #b99158; padding: 9pt 11pt; font: 8.1pt/1.35 Consolas, "Courier New", monospace; color: #203b31; break-inside: avoid; }
      table { width: 100%; border-collapse: collapse; margin: 9pt 0 14pt; font-size: 8.6pt; break-inside: auto; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; }
      th { text-align: left; color: #fff; background: #38604e; font-weight: 650; }
      th, td { vertical-align: top; border: .5pt solid #d8e1db; padding: 5pt 6pt; }
      tr:nth-child(even) td { background: #f6f8f6; }
      ul, ol { padding-left: 19pt; margin: 4pt 0 10pt; }
      li { margin: 2pt 0; padding-left: 2pt; }
      hr { border: 0; border-top: 1pt solid #d8e1db; margin: 18pt 0; }
      h1 + p { color: #53665c; font-size: 10pt; }
      @page { size: A4; margin: 17mm 17mm 18mm 17mm; }
    </style></head><body>${body}</body></html>`,
    { waitUntil: "load" },
  );
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate:
      '<div style="width:100%;margin:0 17mm;color:#738278;font:8px Arial,sans-serif;border-bottom:1px solid #d8e1db;padding-bottom:4px">MOMENTUS · CODEBASE BLUEPRINT</div>',
    footerTemplate:
      '<div style="width:100%;margin:0 17mm;color:#738278;font:8px Arial,sans-serif;border-top:1px solid #d8e1db;padding-top:4px;display:flex;justify-content:space-between"><span>Internal engineering map · 6 November 2026</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    margin: { top: "20mm", right: "17mm", bottom: "21mm", left: "17mm" },
    tagged: true,
  });
} finally {
  await browser.close();
}

const { size } = await stat(outputPath);
console.log(
  `Wrote docs/MOMENTUS_CODEBASE_BLUEPRINT.pdf (${size.toLocaleString()} bytes).`,
);
