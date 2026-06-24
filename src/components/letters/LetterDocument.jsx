/**
 * CHAOS CONTROLLER — UNIFIED LETTER DOCUMENT COMPONENT
 *
 * Single source of truth for letter rendering.
 * Used by: Dashboard preview, Download PDF (via html2canvas), Print, Email attachment.
 *
 * NEVER duplicate this layout elsewhere.
 */

import React from "react";
import { LETTERHEAD_URL, FOOTER_URL } from "@/lib/pdfGenerator";

export const LETTER_FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

/**
 * Strips the AI-generated header block from letter text, returning body from "Dear" onwards.
 */
function stripToBody(text) {
  if (!text) return '';
  const clean = String(text).replace(/<[^>]*>/g, '');
  const dearIdx = clean.search(/\bDear\b/i);
  return dearIdx === -1 ? clean.trim() : clean.slice(dearIdx).trim();
}

/**
 * Splits plain-text letter body into rendered paragraphs.
 * Blank lines → paragraph gap. Non-blank lines → text line.
 */
function renderBody(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let buffer = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    elements.push(
      <p key={elements.length} style={{
        margin: '0 0 10px 0',
        lineHeight: '1.25',
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '11pt',
        color: '#000',
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
      }}>
        {buffer.join('\n')}
      </p>
    );
    buffer = [];
  };

  for (const line of lines) {
    if (line.trim() === '') {
      flushBuffer();
    } else {
      buffer.push(line);
    }
  }
  flushBuffer();

  return elements;
}

/**
 * LetterDocument — the single, canonical letter layout.
 *
 * Props:
 *   receiverLines  string[]  — recipient address lines
 *   senderLines    string[]  — sender address lines
 *   today          string    — formatted date string
 *   reSubject      string    — RE: subject line
 *   bodyText       string    — raw letter body (AI text, plain text)
 *   pageNumber     number    — optional, for multi-page display
 *   totalPages     number    — optional
 *   forPrint       boolean   — if true, adds print-specific class
 */
export default function LetterDocument({
  receiverLines = [],
  senderLines = [],
  today = '',
  reSubject = '',
  bodyText = '',
  pageNumber,
  totalPages,
  forPrint = false,
}) {
  const strippedBody = stripToBody(bodyText);

  return (
    <div
      className={`letter-page ${forPrint ? 'for-print' : ''}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        background: '#fff',
        boxShadow: forPrint ? 'none' : '0 2px 24px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* ── LETTERHEAD BANNER ── */}
      <div style={{ width: '100%', flexShrink: 0 }}>
        <img
          src={LETTERHEAD_URL}
          alt="Chaos Controller"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          crossOrigin="anonymous"
        />
      </div>

      {/* ── LETTER CONTENT ── */}
      <div
        className="letter-body"
        style={{
          flex: 1,
          padding: '16pt 25mm 24pt 25mm',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '11pt',
          color: '#000',
          lineHeight: '1.25',
        }}
      >
        {/* Date — right aligned */}
        <div style={{
          textAlign: 'right',
          marginBottom: '18pt',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '11pt',
          color: '#000',
        }}>
          {today}
        </div>

        {/* Two-column address block */}
        {(receiverLines.length > 0 || senderLines.length > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 24pt',
            marginBottom: '18pt',
          }}>
            {/* Recipient — left */}
            <div>
              {receiverLines.map((line, i) => (
                <div key={i} style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '11pt',
                  color: '#000',
                  lineHeight: '1.4',
                  margin: 0,
                }}>
                  {line}
                </div>
              ))}
            </div>
            {/* Sender — right */}
            <div>
              {senderLines.map((line, i) => (
                <div key={i} style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '11pt',
                  color: '#000',
                  lineHeight: '1.4',
                  margin: 0,
                }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RE: subject line */}
        {reSubject && (
          <div style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '11pt',
            fontWeight: 'bold',
            color: '#000',
            marginBottom: '10pt',
          }}>
            Re: {reSubject}
          </div>
        )}

        {/* Horizontal rule */}
        <hr style={{
          border: 'none',
          borderTop: '1px solid #000',
          margin: '0 0 16pt 0',
        }} />

        {/* Letter body */}
        <div style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '11pt',
          color: '#000',
          lineHeight: '1.25',
        }}>
          {renderBody(strippedBody)}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        width: '100%',
        flexShrink: 0,
        marginTop: 'auto',
      }}>
        {/* Page number */}
        {pageNumber && totalPages && (
          <div style={{
            textAlign: 'center',
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '9pt',
            color: '#555',
            padding: '4pt 0',
          }}>
            Page {pageNumber} of {totalPages}
          </div>
        )}
        <img
          src={LETTER_FOOTER_URL}
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block' }}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}