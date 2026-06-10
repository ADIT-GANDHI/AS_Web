import fs from 'fs';
import path from 'path';

const workspaceRoot = 'd:\\Mihir_Avni\\Ajab_New\\ajabshar-main';
const pdfSourceDir = 'D:\\Ajab Shahar\\PDFS';

const destBase = path.join(workspaceRoot, 'Songs_Localhost_Comparison');
const destListing = path.join(destBase, '1_Songs_Listing');
const destFilter = path.join(destBase, '2_Filter_Panel');
const destDetails = path.join(destBase, '3_Song_Details');

// Ensure directories exist
fs.mkdirSync(destBase, { recursive: true });
fs.mkdirSync(destListing, { recursive: true });
fs.mkdirSync(destFilter, { recursive: true });
fs.mkdirSync(destDetails, { recursive: true });

console.log('Created directories successfully.');

const filesToCopy = [
  // PDF Document itself
  { src: path.join(pdfSourceDir, '2.SongsAll_Detailpg_01.05.2025.pdf'), dest: path.join(destBase, '2.SongsAll_Detailpg_01.05.2025.pdf') },

  // Listing page PDF specifications & crops
  { src: path.join(pdfSourceDir, 'pdf_page1_hi.png'), dest: path.join(destListing, 'pdf-songs-listing.png') },
  { src: path.join(pdfSourceDir, 'cmp_pdf_full.png'), dest: path.join(destListing, 'cmp_pdf_full.png') },
  { src: path.join(pdfSourceDir, 'song_card_pdf.png'), dest: path.join(destListing, 'song_card_pdf.png') },
  { src: path.join(pdfSourceDir, 'song_card_col.png'), dest: path.join(destListing, 'song_card_col.png') },

  // Listing page Localhost screenshots
  { src: path.join(workspaceRoot, 'Songs_Comparison', 'localhost-songs-listing.png'), dest: path.join(destListing, 'localhost-songs-listing.png') },

  // Filter page PDF specifications & crops
  { src: path.join(pdfSourceDir, 'pdf_page2_hi.png'), dest: path.join(destFilter, 'pdf-filter-panel.png') },
  { src: path.join(pdfSourceDir, 'cmp_pdf_filter.png'), dest: path.join(destFilter, 'cmp_pdf_filter.png') },
  { src: path.join(pdfSourceDir, 'pdf_text_filter_zone.png'), dest: path.join(destFilter, 'pdf_text_filter_zone.png') },

  // Filter page Localhost screenshots
  { src: path.join(workspaceRoot, 'Songs_Comparison', 'localhost-filter-panel-empty.png'), dest: path.join(destFilter, 'localhost-filter-panel-empty.png') },
  { src: path.join(workspaceRoot, 'Songs_Comparison', 'localhost-filter-panel-with-chips.png'), dest: path.join(destFilter, 'localhost-filter-panel-with-chips.png') },

  // Song details PDF specifications & crops
  { src: path.join(pdfSourceDir, 'page_3.png'), dest: path.join(destDetails, 'pdf-song-detail.png') },
  { src: path.join(pdfSourceDir, 'detail_top.png'), dest: path.join(destDetails, 'detail_top.png') },
  { src: path.join(pdfSourceDir, 'detail_mid.png'), dest: path.join(destDetails, 'detail_mid.png') },
  { src: path.join(pdfSourceDir, 'detail_video_zone.png'), dest: path.join(destDetails, 'detail_video_zone.png') },

  // Song details Localhost screenshot
  { src: path.join(workspaceRoot, 'Songs_Comparison', 'localhost-song-detail.png'), dest: path.join(destDetails, 'localhost-song-detail.png') }
];

for (const file of filesToCopy) {
  if (fs.existsSync(file.src)) {
    try {
      fs.copyFileSync(file.src, file.dest);
      console.log(`Copied: ${path.basename(file.src)} -> ${path.relative(workspaceRoot, file.dest)}`);
    } catch (err) {
      console.error(`Failed to copy ${file.src}: ${err.message}`);
    }
  } else {
    console.warn(`Source file not found: ${file.src}`);
  }
}
