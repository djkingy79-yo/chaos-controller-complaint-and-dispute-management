import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Names of escalation/regulatory bodies that could appear in a previously
// generated letter. If a letter mentions one of these and it is NOT part of
// the case's CURRENT escalation_body/complaint_pathway, the letter is stale —
// it was written before the pathway was corrected (e.g. legal_profession
// cases wrongly routed to NCAT/Fair Trading before being fixed to route to
// the OLSC).
const KNOWN_BODIES = [
  'NSW Fair Trading', 'Fair Trading', 'NCAT', 'VCAT', 'QCAT', 'SAT', 'ACAT', 'NTCAT',
  'AFCA', 'TIO', 'NSW Ombudsman', 'Energy and Water Ombudsman', 'EWON',
  'Telecommunications Industry Ombudsman', 'Consumer Affairs Victoria',
  'Office of the Legal Services Commissioner', 'OLSC', 'Law Society',
];

const LETTER_FIELDS = {
  letter1: 'first_complaint_letter',
  letter2: 'second_complaint_letter',
  letter3: 'third_complaint_letter',
  accept_offer: 'accept_offer_letter',
  deny_offer: 'deny_offer_letter',
  escalation: 'escalation_letter',
};

function findStaleLetters(caseItem) {
  const currentBodyText = String(caseItem.escalation_body || '').toLowerCase();
  const pathway = caseItem.complaint_pathway || {};
  const currentPathwayValues = [pathway.regulator, pathway.ombudsman, pathway.tribunal, pathway.court]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());

  const stale = [];
  for (const [key, field] of Object.entries(LETTER_FIELDS)) {
    const content = caseItem[field];
    if (!content) continue;
    const lowerContent = content.toLowerCase();
    const mentionsOutdatedBody = KNOWN_BODIES.some((body) => {
      const lowerBody = body.toLowerCase();
      if (!lowerContent.includes(lowerBody)) return false;
      // Mentioned body matches the current escalation body/pathway — not stale.
      if (currentBodyText.includes(lowerBody) || lowerBody.includes(currentBodyText)) return false;
      if (currentPathwayValues.some((v) => v.includes(lowerBody) || lowerBody.includes(v))) return false;
      return true;
    });
    if (mentionsOutdatedBody) stale.push(key);
  }
  return stale;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const { caseId } = await req.json().catch(() => ({}));

    const cases = caseId
      ? [await base44.asServiceRole.entities.Case.get(caseId)]
      : await base44.asServiceRole.entities.Case.filter({});

    let checked = 0;
    let flagged = 0;
    const results = [];

    for (const caseItem of cases) {
      if (!caseItem || !caseItem.complaint_pathway) continue;
      checked++;
      const staleLetters = findStaleLetters(caseItem);
      await base44.asServiceRole.entities.Case.update(caseItem.id, {
        stale_letters: staleLetters,
        stale_letters_checked_at: new Date().toISOString(),
      });
      if (staleLetters.length > 0) {
        flagged++;
        results.push({ caseId: caseItem.id, title: caseItem.title, staleLetters });
      }
    }

    return Response.json({ success: true, checked, flagged, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});