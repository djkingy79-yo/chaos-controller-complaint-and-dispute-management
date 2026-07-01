/**
 * CHAOS CONTROLLER — UNIFIED REPORT DOCUMENT
 *
 * Single source of truth for every multi-section report in the app:
 *   - Dashboard "Complete Case Report" (CaseDashboardReport.jsx)
 *   - AI Analysis report (ExecutiveSummaryGenerator.jsx)
 *   - Every section of the Case Transfer Package (CaseTransferPackage.jsx)
 *
 * Same capture pathway as letters: html2canvas → jsPDF (see captureDocumentPDF
 * in src/lib/pdfGenerator.js). Thin header/footer bands — no page bleed.
 */

import React from "react";

export const REPORT_HEADER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const REPORT_FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

const A4_PX_WIDTH = 794;
const H_PAD = 48;
const BASE_FONT = '"Times New Roman", Times, serif';

const styles = {
  title: { fontFamily: BASE_FONT, fontSize: '19px', fontWeight: 'bold', color: '#000', margin: '0 0 4px 0' },
  subtitle: { fontFamily: BASE_FONT, fontSize: '13px', color: '#333', margin: '0 0 2px 0' },
  meta: { fontFamily: BASE_FONT, fontSize: '10.5px', color: '#777', margin: '0 0 14px 0' },
  heading: {
    fontFamily: BASE_FONT, fontSize: '13px', fontWeight: 'bold', color: '#fff',
    background: '#1a1a1a', padding: '5px 10px', margin: '18px 0 8px 0',
    textTransform: 'uppercase', letterSpacing: '0.4px', boxSizing: 'border-box',
  },
  row: { fontFamily: BASE_FONT, fontSize: '12px', color: '#000', margin: '0 0 4px 0', display: 'flex', gap: '6px' },
  rowLabel: { fontWeight: 'bold', minWidth: '150px', flexShrink: 0 },
  para: { fontFamily: BASE_FONT, fontSize: '12px', lineHeight: '1.4', color: '#000', margin: '0 0 8px 0', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' },
  bullet: { fontFamily: BASE_FONT, fontSize: '12px', lineHeight: '1.4', color: '#000', margin: '0 0 4px 14px', display: 'flex' },
  divider: { border: 'none', borderTop: '1px solid #ccc', margin: '2px 0 10px 0' },
};

// Renders one section as a FLAT array of individual block elements (heading,
// each row, each paragraph, each bullet) — never one big wrapping div. This is
// what lets the PDF paginator split BETWEEN rows/bullets/paragraphs instead of
// treating a whole multi-line section as one unsplittable block.
function renderSectionBlocks(section, idx) {
  const { heading, rows, paragraphs, bullets, empty } = section;
  const cleanParas = (paragraphs || []).filter(p => p !== null && p !== undefined && String(p).trim() !== '');
  const hasContent = (rows && rows.length) || cleanParas.length || (bullets && bullets.length);
  const blocks = [];

  blocks.push(<div key={`h-${idx}`} data-heading="true" style={styles.heading}>{heading}</div>);

  rows?.forEach((r, i) => blocks.push(
    <div key={`r-${idx}-${i}`} style={styles.row}>
      <span style={styles.rowLabel}>{r.label}:</span>
      <span style={{ overflowWrap: 'break-word' }}>{r.value || '—'}</span>
    </div>
  ));

  cleanParas.forEach((p, i) => blocks.push(<p key={`p-${idx}-${i}`} style={styles.para}>{p}</p>));

  bullets?.forEach((b, i) => blocks.push(
    <div key={`b-${idx}-${i}`} style={styles.bullet}>
      <span style={{ marginRight: 6, flexShrink: 0 }}>•</span>
      <span style={{ overflowWrap: 'break-word' }}>{b}</span>
    </div>
  ));

  if (!hasContent) blocks.push(
    <p key={`e-${idx}`} style={{ ...styles.para, color: '#888', fontStyle: 'italic' }}>{empty || 'No data recorded.'}</p>
  );

  return blocks;
}

export default function ReportDocument({ title, subtitle, generatedLabel, sections = [] }) {
  return (
    <div
      className="letter-page"
      style={{
        width: A4_PX_WIDTH + 'px',
        margin: '0 auto',
        background: '#fff',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Header — full width, height follows the image's own aspect ratio so
          the artwork is never cropped, stretched or zoomed */}
      <div style={{ width: '100%', flexShrink: 0, lineHeight: 0 }}>
        <img
          src={REPORT_HEADER_URL}
          alt="Chaos Controller"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          crossOrigin="anonymous"
        />
      </div>

      <div style={{ padding: `22px ${H_PAD}px`, boxSizing: 'border-box', width: '100%' }}>
        {title && <div style={styles.title}>{title}</div>}
        {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
        {generatedLabel && <div style={styles.meta}>{generatedLabel}</div>}
        <hr style={styles.divider} />
        <div data-paginate-body="true">
          {sections.flatMap((s, i) => renderSectionBlocks(s, i))}
        </div>
      </div>

      {/* Footer — full width, height follows the image's own aspect ratio */}
      <div style={{ width: '100%', flexShrink: 0, marginTop: 'auto', lineHeight: 0 }}>
        <img
          src={REPORT_FOOTER_URL}
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block' }}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}

export function ReportPreviewWrapper({ children }) {
  return (
    <div style={{ width: '100%', overflowX: 'auto', background: '#f0f0f0', borderRadius: '8px', padding: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'center', minWidth: A4_PX_WIDTH + 'px' }}>
        <div style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.15)', borderRadius: '2px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}