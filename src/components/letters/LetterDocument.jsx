/**
 * CHAOS CONTROLLER — UNIFIED LETTER DOCUMENT COMPONENT
 *
 * Single source of truth for letter rendering.
 * Used by: Dashboard preview, Download PDF (html2canvas capture), Print.
 *
 * CRITICAL RULES:
 * - Width MUST be exactly 794px (96dpi A4 equivalent) so html2canvas capture = A4 PDF.
 * - Every element uses box-sizing: border-box.
 * - No element may overflow width.
 * - overflow-wrap: break-word everywhere.
 * - This component renders the SAME for preview and PDF capture.
 */

import React from "react";

export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const LETTER_FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

// A4 at 96dpi = 794px wide. Use this as the canonical pixel width.
const A4_PX_WIDTH = 794;
// Horizontal padding inside the page (approx 18mm each side at 96dpi)
const H_PAD = 68;

// ─────────────────────────────────────────────────────────────────────────────
// Section heading names we recognise in AI letter output
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_HEADINGS = [
  'BACKGROUND',
  'WHAT HAPPENED',
  'RESPONSE RECEIVED',
  'NAB\'S RESPONSE',
  'BANK\'S RESPONSE',
  'INSURER\'S RESPONSE',
  'ORGANISATION\'S RESPONSE',
  'EVIDENCE RELIED UPON',
  'EVIDENCE PROVIDED',
  'IMPACT',
  'OUTCOME REQUESTED',
  'NEXT STEPS',
  'LEGAL BASIS',
  'LEGAL OBLIGATIONS',
  'RELEVANT RIGHTS',
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

/**
 * Strips the AI-generated header block (date, addresses, RE line)
 * returning text from "Dear" onwards.
 */
function stripToBody(text) {
  if (!text) return '';
  const clean = String(text).replace(/<[^>]*>/g, '');
  const dearIdx = clean.search(/\bDear\b/i);
  return dearIdx === -1 ? clean.trim() : clean.slice(dearIdx).trim();
}

/**
 * Renders the letter body as structured HTML elements.
 * - Recognises section headings → bold uppercase with underline
 * - Recognises bullet lines → styled list item
 * - Blank lines → paragraph breaks
 * - Everything else → plain paragraph
 */
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
        <p key={key++} style={bodyParaStyle}>{content}</p>
      );
    }
    paraBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      flushPara();
      continue;
    }

    if (isHeading(trimmed)) {
      flushPara();
      elements.push(
        <div key={key++} style={headingStyle}>
          {trimmed.replace(/:$/, '')}
        </div>
      );
      continue;
    }

    if (isBullet(trimmed)) {
      flushPara();
      elements.push(
        <div key={key++} style={bulletStyle}>
          <span style={{ marginRight: 6, flexShrink: 0 }}>•</span>
          <span style={{ flex: 1, overflowWrap: 'break-word', wordBreak: 'normal' }}>
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

// ─── Inline styles — all pixel-based, no mm units ─────────────────────────────

const bodyParaStyle = {
  margin: '0 0 10px 0',
  lineHeight: '1.25',
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '13px',  // ≈11pt at 96dpi
  color: '#000',
  textAlign: 'left',
  overflowWrap: 'break-word',
  wordBreak: 'normal',
  maxWidth: '100%',
  boxSizing: 'border-box',
};

const headingStyle = {
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#000',
  textTransform: 'uppercase',
  margin: '16px 0 4px 0',
  paddingBottom: '3px',
  borderBottom: '1px solid #000',
  overflowWrap: 'break-word',
  wordBreak: 'normal',
  maxWidth: '100%',
  boxSizing: 'border-box',
};

const bulletStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '13px',
  color: '#000',
  margin: '0 0 6px 16px',
  lineHeight: '1.25',
  overflowWrap: 'break-word',
  wordBreak: 'normal',
  maxWidth: '100%',
  boxSizing: 'border-box',
};

/**
 * LetterDocument
 *
 * Props:
 *   receiverLines  string[]
 *   senderLines    string[]
 *   today          string
 *   reSubject      string
 *   bodyText       string   — full AI letter text (header block auto-stripped)
 *   pageNumber     number   — optional
 *   totalPages     number   — optional
 */
export default function LetterDocument({
  receiverLines = [],
  senderLines = [],
  today = '',
  reSubject = '',
  bodyText = '',
  pageNumber,
  totalPages,
}) {
  const strippedBody = stripToBody(bodyText);

  return (
    <div
      className="letter-page"
      style={{
        width: A4_PX_WIDTH + 'px',
        minHeight: '1122px',  // A4 at 96dpi = 1122px tall
        margin: '0 auto',
        background: '#fff',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        // Shadow for preview only — stripped in print CSS
        boxShadow: '0 2px 24px rgba(0,0,0,0.12)',
      }}
    >
      {/* ── LETTERHEAD ── */}
      <div style={{ width: '100%', flexShrink: 0, boxSizing: 'border-box' }}>
        <img
          src={LETTERHEAD_URL}
          alt="Chaos Controller"
          style={{ width: '100%', height: 'auto', display: 'block', boxSizing: 'border-box' }}
          crossOrigin="anonymous"
        />
      </div>

      {/* ── CONTENT AREA ── */}
      <div
        className="letter-body"
        style={{
          flex: 1,
          padding: `18px ${H_PAD}px 24px ${H_PAD}px`,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          overflowWrap: 'break-word',
          wordBreak: 'normal',
        }}
      >
        {/* Date — right */}
        {today && (
          <div style={{
            textAlign: 'right',
            marginBottom: '22px',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '13px',
            color: '#000',
            boxSizing: 'border-box',
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
            marginBottom: '22px',
            boxSizing: 'border-box',
            width: '100%',
            overflow: 'hidden',
          }}>
            <div style={{ overflowWrap: 'break-word', wordBreak: 'normal', boxSizing: 'border-box', overflow: 'hidden' }}>
              {receiverLines.map((line, i) => (
                <div key={i} style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '13px',
                  color: '#000',
                  lineHeight: '1.4',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  boxSizing: 'border-box',
                }}>
                  {line}
                </div>
              ))}
            </div>
            <div style={{ overflowWrap: 'break-word', wordBreak: 'normal', boxSizing: 'border-box', overflow: 'hidden' }}>
              {senderLines.map((line, i) => (
                <div key={i} style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '13px',
                  color: '#000',
                  lineHeight: '1.4',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  boxSizing: 'border-box',
                }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RE: subject */}
        {reSubject && (
          <div style={{
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#000',
            marginBottom: '12px',
            overflowWrap: 'break-word',
            wordBreak: 'normal',
            boxSizing: 'border-box',
          }}>
            Re: {reSubject}
          </div>
        )}

        {/* Rule */}
        <hr style={{
          border: 'none',
          borderTop: '1px solid #000',
          margin: '0 0 18px 0',
          boxSizing: 'border-box',
        }} />

        {/* Letter body */}
        <div style={{
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: '13px',
          color: '#000',
          lineHeight: '1.25',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
          overflowWrap: 'break-word',
          wordBreak: 'normal',
        }}>
          {renderBody(strippedBody)}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ width: '100%', flexShrink: 0, marginTop: 'auto', boxSizing: 'border-box' }}>
        {pageNumber && totalPages && (
          <div style={{
            textAlign: 'center',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '11px',
            color: '#666',
            padding: '4px 0',
            boxSizing: 'border-box',
          }}>
            Page {pageNumber} of {totalPages}
          </div>
        )}
        <img
          src={LETTER_FOOTER_URL}
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block', boxSizing: 'border-box' }}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}