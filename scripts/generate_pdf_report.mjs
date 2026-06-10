import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const workspaceRoot = 'd:\\Mihir_Avni\\Ajab_New\\ajabshar-main';
const destBase = path.join(workspaceRoot, 'Songs_Localhost_Comparison');
const mdFilePath = path.join(destBase, 'Detailed_Implementation_Comparison.md');
const pdfOutputPath = path.join(destBase, 'Ajab_Shahar_Songs_Implementation_Report_v2.pdf');

function parseMarkdownToHtml(md) {
  let html = '';
  const lines = md.split(/\r?\n/);
  let inList = false;
  let inBlockquote = false;
  let inCarousel = false;
  let carouselContent = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Handle Carousel Blocks
    if (line.startsWith('````carousel')) {
      inCarousel = true;
      carouselContent = [];
      continue;
    }
    if (inCarousel) {
      if (line.startsWith('````')) {
        inCarousel = false;
        // Process Carousel Content
        html += processCarousel(carouselContent.join('\n'));
        continue;
      }
      carouselContent.push(lines[i]); // Keep original indentation
      continue;
    }

    // Close open blocks if line is empty or doesn't match
    if (line === '') {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      if (inBlockquote) {
        html += '</blockquote>\n';
        inBlockquote = false;
      }
      continue;
    }

    // Handle Lists
    if (line.startsWith('* ') || line.startsWith('- ')) {
      if (inBlockquote) {
        html += '</blockquote>\n';
        inBlockquote = false;
      }
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      let content = line.substring(2);
      html += `  <li>${parseInlineStyles(content)}</li>\n`;
      continue;
    }

    // Handle Blockquotes
    if (line.startsWith('>')) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      if (!inBlockquote) {
        html += '<blockquote>\n';
        inBlockquote = true;
      }
      let content = line.replace(/^>\s*/, '');
      html += `  <p>${parseInlineStyles(content)}</p>\n`;
      continue;
    }

    // Handle Headings
    if (line.startsWith('#')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }

      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = parseInlineStyles(match[2]);
        html += `<h${level}>${text}</h${level}>\n`;
      }
      continue;
    }

    // Handle horizontal dividers
    if (line === '---') {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
      html += '<hr />\n';
      continue;
    }

    // Default Paragraph
    if (inList) { html += '</ul>\n'; inList = false; }
    if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
    html += `<p>${parseInlineStyles(lines[i].trim())}</p>\n`;
  }

  // Close any dangling lists or blockquotes
  if (inList) html += '</ul>\n';
  if (inBlockquote) html += '</blockquote>\n';

  return html;
}

function parseInlineStyles(text) {
  let content = text;
  // Escape simple HTML characters first to avoid issues
  content = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold text: **text**
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Inline code: `code`
  content = content.replace(/`(.*?)`/g, '<code>$1</code>');

  // Images: ![alt](url)
  content = content.replace(/!\[(.*?)\]\((.*?)\)/g, '<img class="inline-img" src="$2" alt="$1" />');

  // Links: [text](url)
  content = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  return content;
}

function processCarousel(blockText) {
  const slides = blockText.split('<!-- slide -->');
  let rowHtml = '<div class="comparison-row">\n';

  for (const slide of slides) {
    const trimmed = slide.trim();
    if (trimmed === '') continue;

    // Check if it's an image
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/m);
    if (imgMatch) {
      const caption = imgMatch[1];
      const url = imgMatch[2];
      rowHtml += `
      <div class="comparison-col">
        <div class="comparison-col-header">${caption}</div>
        <div class="comparison-img-wrapper">
          <img src="${url}" alt="${caption}" />
        </div>
      </div>\n`;
    } else {
      // It's text/code/guideline
      let textContent = trimmed;
      // Clean up code blocks if any
      textContent = textContent.replace(/^```\r?\n?/, '').replace(/\r?\n?```$/, '');
      const parsedText = parseMarkdownToHtml(textContent);
      rowHtml += `
      <div class="comparison-col">
        <div class="comparison-col-header">Design Specification / Guidelines</div>
        <div class="comparison-text-box">
          ${parsedText}
        </div>
      </div>\n`;
    }
  }

  rowHtml += '</div>\n';
  return rowHtml;
}

async function run() {
  console.log('Reading Markdown report...');
  if (!fs.existsSync(mdFilePath)) {
    console.error(`Source file not found at ${mdFilePath}`);
    process.exit(1);
  }
  
  const markdown = fs.readFileSync(mdFilePath, 'utf8');
  console.log('Parsing markdown content to HTML...');
  const mainContentHtml = parseMarkdownToHtml(markdown);

  // Premium template with print stylesheets
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ajab Shahar Songs Implementation & Alignment Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&family=Lora:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #2C3E50;
      margin: 0;
      padding: 0;
      background: #FFFFFF;
      -webkit-print-color-adjust: exact;
    }
    
    /* Cover and main headers */
    h1 {
      font-family: 'Lora', Georgia, serif;
      font-size: 26pt;
      font-weight: 700;
      color: #1A252C;
      text-align: center;
      margin-top: 0.5in;
      margin-bottom: 24px;
      line-height: 1.2;
    }
    
    p.lead-text {
      font-size: 12pt;
      text-align: center;
      max-width: 800px;
      margin: 0 auto 40px;
      color: #7F8C8D;
      font-style: italic;
    }

    h2 {
      font-family: 'Lora', Georgia, serif;
      font-size: 18pt;
      color: #E31E79;
      border-bottom: 2px solid #E31E79;
      padding-bottom: 6px;
      margin-top: 2.5em;
      margin-bottom: 16px;
      break-after: avoid;
    }

    h3 {
      font-family: 'Lora', Georgia, serif;
      font-size: 13pt;
      color: #2C3E50;
      margin-top: 1.8em;
      margin-bottom: 8px;
      break-after: avoid;
    }

    /* Paragraph and bullet spacing */
    p {
      margin: 0 0 12px;
    }
    
    ul {
      margin: 0 0 16px;
      padding-left: 24px;
    }
    
    li {
      margin-bottom: 6px;
    }

    hr {
      border: 0;
      height: 1px;
      background: #E5E9EC;
      margin: 40px 0;
    }

    /* Blockquotes (Client feedback & Tech explanation) */
    blockquote {
      background: #FDF6F8;
      border-left: 4px solid #E31E79;
      padding: 14px 20px;
      margin: 14px 0 24px;
      border-radius: 0 6px 6px 0;
      break-inside: avoid;
    }
    blockquote p {
      margin-bottom: 8px;
      font-size: 10pt;
    }
    blockquote p:last-child {
      margin-bottom: 0;
    }
    blockquote strong {
      color: #E31E79;
    }

    /* Code blocks */
    code {
      font-family: Consolas, Monaco, monospace;
      background: #F0F2F4;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9pt;
      color: #D35400;
    }

    /* Custom Layout side-by-side comparison columns */
    .comparison-row {
      display: flex;
      flex-direction: row;
      gap: 20px;
      margin: 20px 0 30px;
      width: 100%;
      break-inside: avoid;
    }

    .comparison-col {
      flex: 1;
      min-width: 0; /* Prevents overflow */
      background: #FAFAFA;
      border: 1px solid #E5E9EC;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .comparison-col-header {
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #7F8C8D;
      text-transform: uppercase;
      margin-bottom: 12px;
      border-bottom: 1px solid #E5E9EC;
      width: 100%;
      padding-bottom: 8px;
      text-align: center;
    }

    .comparison-img-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #FFF;
      border: 1px solid #E5E9EC;
      border-radius: 6px;
      padding: 6px;
      box-sizing: border-box;
    }

    .comparison-img-wrapper img {
      max-width: 100%;
      max-height: 280px;
      object-fit: contain;
      border-radius: 4px;
    }

    .comparison-text-box {
      width: 100%;
      background: #FFF;
      border: 1px solid #E5E9EC;
      border-radius: 6px;
      padding: 14px 18px;
      box-sizing: border-box;
      font-size: 9.5pt;
      line-height: 1.5;
      font-style: italic;
      color: #7F8C8D;
      text-align: center;
    }

    /* Avoid page-breaks on key blocks */
    h2, h3, blockquote, .comparison-row {
      break-inside: avoid;
    }

    /* Print specifications */
    @media print {
      @page {
        size: A4;
        margin: 1.5cm 1.5cm 2cm 1.5cm;
      }
      body {
        font-size: 10pt;
      }
      /* Simple header/footer injection */
      header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 30px;
        border-bottom: 1px solid #E5E9EC;
        font-size: 8pt;
        color: #BDC3C7;
      }
    }
  </style>
</head>
<body>
  <div style="max-width: 900px; margin: 0 auto; padding: 20px;">
    ${mainContentHtml}
  </div>
</body>
</html>
  `;

  const htmlTempPath = path.join(destBase, 'temp_report.html');
  fs.writeFileSync(htmlTempPath, fullHtml, 'utf8');
  console.log(`Saved temporary HTML report to ${htmlTempPath}`);

  console.log('Launching headless Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();

  console.log('Loading local HTML document...');
  // Open the absolute file path directly so local absolute file:/// image references load seamlessly
  const fileUrl = `file:///${htmlTempPath.replace(/\\/g, '/')}`;
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  
  // Wait additional buffer for any high-res local images to fully paint
  await page.waitForTimeout(3000);

  console.log('Exporting document as high-fidelity PDF...');
  await page.pdf({
    path: pdfOutputPath,
    format: 'A4',
    margin: {
      top: '1.8cm',
      bottom: '1.8cm',
      left: '1.6cm',
      right: '1.6cm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: Arial, sans-serif; font-size: 7.5pt; width: 100%; text-align: center; border-bottom: 1px solid #F0F0F0; padding-bottom: 3px; color: #95A5A6; margin-left: 20px; margin-right: 20px;">
        Ajab Shahar — Songs Module Implementation & Design Alignment Report
      </div>
    `,
    footerTemplate: `
      <div style="font-family: Arial, sans-serif; font-size: 7.5pt; width: 100%; display: flex; justify-content: space-between; border-top: 1px solid #F0F0F0; padding-top: 3px; color: #95A5A6; padding-left: 20px; padding-right: 20px;">
        <span>Status: Fully Implemented</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `
  });

  console.log('Closing browser...');
  await browser.close();

  // Cleanup temporary HTML file
  try {
    fs.unlinkSync(htmlTempPath);
    console.log('Removed temporary HTML file.');
  } catch (err) {}

  console.log(`--- SUCCESS: PDF REPORT GENERATED AT ${pdfOutputPath} ---`);
}

run().catch(err => {
  console.error('PDF Generation execution error:', err);
  process.exit(1);
});
