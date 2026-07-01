/**
 * CHAOS CONTROLLER — UNIFIED LETTER DOCUMENT
 *
 * Single source of truth for ALL letter rendering:
 *   - Dashboard preview  (scaled to fit container)
 *   - Download PDF       (html2canvas capture of the raw 794px node)
 *   - Print              (iframe print — no browser URL/header/footer)
 *   - Email attachment   (same capture)
 *
 * The component itself always renders at exactly 794px wide (A4 @ 96dpi).
 * The parent wraps it in a scaled container for dashboard preview.
 */

import React from "react";

export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const LETTER_FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

// A4 at 96dpi
const A4_PX_WIDTH = 794;
// Horizontal padding inside the content area (~18mm at 96dpi)
const H_PAD = 68;

// ─── Section headings recognised in AI output ─────────────────────────────────
const SECTION_HEADINGS = [
  'BACKGROUND',
  'WHAT HAPPENED',
  'RESPONSE RECEIVED',
  "NAB'S RESPONSE",
  "BANK'S RESPONSE",
  "INSURER'S RESPONSE",
  "ORGANISATION'S RESPONSE",
  'EVIDENCE RELIED UPON',
  'EVIDENCE PROVIDED',
  'IMPACT',
  'OUTCOME REQUESTED',
  'NEXT STEPS',
  'LEGAL BASIS',
  'LEGAL OBLIGATIONS',
  'RELEVANT RIGHTS',
  'RELEVANT RIGHTS/OBLIGATIONS',
  'SUMMARY',
  'ESCALATION',
];

function isHeading(line) {
  const upper = line.trim().toUpperCase().replace(/:$/, '');
  return SECTION_HEADINGS.some(h => upper === h || upper.startsWith(h + ':'));
}

function isBullet(line) {
  return /^[-•*]\s+/.test(line.trim());
}

/** Strip AI-generated address block — return text from "Dear" onwards */
function stripToBody(text) {
  if (!text) return '';
  const clean = String(text).replace(/<[^>]*>/g, '');
  const idx = clean.search(/\bDear\b/i);
  return idx === -1 ? clean.trim() : clean.slice(idx).trim();
}

/** Render AI letter body as structured React elements */
function renderBody(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let paraBuffer = [];
  let key = 0;

  const flushPara = () => {
    if (!paraBuffer.length) return;
    const content = paraBuffer.join('\n').trim();
    if (content) {
      elements.push(
        <p key={key++} style={styles.para}>{content}</p>
      );
    }
    paraBuffer = [];
  };

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (!trimmed) {
      flushPara();
      continue;
    }

    if (isHeading(trimmed)) {
      flushPara();
      elements.push(
        <div key={key++} style={styles.heading}>
          {trimmed.replace(/:$/, '')}
        </div>
      );
      continue;
    }

    if (isBullet(trimmed)) {
      flushPara();
      elements.push(
        <div key={key++} style={styles.bullet}>
          <span style={{ marginRight: 6, flexShrink: 0 }}>•</span>
          <span style={{ flex: 1, overflowWrap: 'break-word' }}>
            {trimmed.replace(/^[-•*]\s+/, '')}
          </span>
        </div>
      );
      continue;
    }

    paraBuffer.push(raw);
  }
  flushPara();
  return elements;
}

// ─── Shared inline styles ─────────────────────────────────────────────────────
const BASE_FONT = '"Times New Roman", Times, serif';
const BASE_SIZE = '13px'; // ≈ 11pt at 96dpi

const styles = {
  para: {
    margin: '0 0 8px 0',
    lineHeight: '1.25',
    fontFamily: BASE_FONT,
    fontSize: BASE_SIZE,
    color: '#000',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    boxSizing: 'border-box',
  },
  heading: {
    fontFamily: BASE_FONT,
    fontSize: BASE_SIZE,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
    margin: '16px 0 4px 0',
    paddingBottom: '3px',
    borderBottom: '1px solid #000',
    overflowWrap: 'break-word',
    boxSizing: 'border-box',
  },
  bullet: {
    display: 'flex',
    alignItems: 'flex-start',
    fontFamily: BASE_FONT,
    fontSize: BASE_SIZE,
    color: '#000',
    margin: '0 0 6px 16px',
    lineHeight: '1.25',
    overflowWrap: 'break-word',
    boxSizing: 'border-box',
  },
  addressLine: {
    fontFamily: BASE_FONT,
    fontSize: BASE_SIZE,
    color: '#000',
    lineHeight: '1.4',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    boxSizing: 'border-box',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LetterDocument — always 794px wide. Wrap in <LetterPreviewWrapper> for screen.
// ─────────────────────────────────────────────────────────────────────────────
export default function LetterDocument({
  receiverLines = [],
  senderLines = [],
  today = '',
  reSubject = '',
  bodyText = '',
}) {
  const strippedBody = stripToBody(bodyText);

  return (
    <div
      className="letter-page"
      style={{
        width: A4_PX_WIDTH + 'px',
        minHeight: '1122px', // A4 at 96dpi
        margin: '0 auto',
        background: '#fff',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* ── LETTERHEAD BANNER (thin band, no bleed) ── */}
      <div style={{ width: '100%', height: '52px', overflow: 'hidden', flexShrink: 0, lineHeight: 0, boxSizing: 'border-box' }}>
        <img
          src={LETTERHEAD_URL}
          alt="Chaos Controller"
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
          crossOrigin="anonymous"
        />
      </div>

      {/* ── CONTENT AREA ── */}
      <div
        className="letter-body"
        style={{
          flex: 1,
          padding: `20px ${H_PAD}px 24px ${H_PAD}px`,
          boxSizing: 'border-box',
          width: '100%',
          overflowWrap: 'break-word',
        }}
      >
        {/* Date — right aligned */}
        {today && (
          <div style={{
            textAlign: 'right',
            marginBottom: '20px',
            fontFamily: BASE_FONT,
            fontSize: BASE_SIZE,
            color: '#000',
          }}>
            {today}
          </div>
        )}

        {/* Two-column address block */}
        {(receiverLines.length > 0 || senderLines.length > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 32px',
            marginBottom: '20px',
            boxSizing: 'border-box',
            width: '100%',
          }}>
            <div style={{ overflow: 'hidden', boxSizing: 'border-box' }}>
              {receiverLines.map((line, i) => (
                <div key={i} style={styles.addressLine}>{line}</div>
              ))}
            </div>
            <div style={{ overflow: 'hidden', boxSizing: 'border-box' }}>
              {senderLines.map((line, i) => (
                <div key={i} style={styles.addressLine}>{line}</div>
              ))}
            </div>
          </div>
        )}

        {/* RE: subject */}
        {reSubject && (
          <div style={{
            fontFamily: BASE_FONT,
            fontSize: BASE_SIZE,
            fontWeight: 'bold',
            color: '#000',
            marginBottom: '10px',
            overflowWrap: 'break-word',
          }}>
            Re: {reSubject}
          </div>
        )}

        {/* Rule */}
        <hr style={{
          border: 'none',
          borderTop: '1px solid #000',
          margin: '0 0 16px 0',
        }} />

        {/* Letter body — marked so the PDF paginator knows this is the splittable
            block; everything before it (date/address/subject/rule) stays on page 1 only */}
        <div data-paginate-body="true" style={{
          fontFamily: BASE_FONT,
          fontSize: BASE_SIZE,
          color: '#000',
          lineHeight: '1.25',
          width: '100%',
          boxSizing: 'border-box',
          overflowWrap: 'break-word',
        }}>
          {renderBody(strippedBody)}
        </div>
      </div>

      {/* ── FOOTER (thin band, no bleed) ── */}
      <div style={{ width: '100%', height: '32px', overflow: 'hidden', flexShrink: 0, marginTop: 'auto', lineHeight: 0, boxSizing: 'border-box' }}>
        <img
          src={LETTER_FOOTER_URL}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LetterPreviewWrapper — scales the 794px LetterDocument to fit any container.
// Use this in the dashboard. The raw LetterDocument ref is used for PDF capture.
// ─────────────────────────────────────────────────────────────────────────────
export function LetterPreviewWrapper({ children }) {
  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        background: '#f0f0f0',
        borderRadius: '8px',
        padding: '16px 0',
      }}
    >
      {/* Centring shell — lets the 794px doc scroll on small screens */}
      <div style={{ display: 'flex', justifyContent: 'center', minWidth: A4_PX_WIDTH + 'px' }}>
        <div style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.15)', borderRadius: '2px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}