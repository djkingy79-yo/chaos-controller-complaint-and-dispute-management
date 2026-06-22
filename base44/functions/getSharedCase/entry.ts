import { createClient } from 'npm:@base44/sdk@0.8.31';

const SHARE_TOKEN_EXPIRY_HOURS = 72; // Share links expire after 72 hours

// Rate limiting: track failed attempts per IP/token combo (in-memory, per-runtime)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10; // Max 10 failed attempts per window
const RATE_LIMIT_BLOCK_MS = 60 * 60 * 1000; // 1 hour block after exceeding limit

function getRateLimitKey(ip, token) {
  return `rl:${ip}:${token.slice(0, 8)}`;
}

function checkRateLimit(ip, token) {
  const key = getRateLimitKey(ip, token);
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record) {
    rateLimitMap.set(key, { attempts: 1, firstAttempt: now, blocked: false, blockUntil: 0 });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 };
  }
  
  // Check if currently blocked
  if (record.blocked && now < record.blockUntil) {
    const retryAfter = Math.ceil((record.blockUntil - now) / 1000);
    return { allowed: false, retryAfter, blocked: true };
  }
  
  // Reset if window expired
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { attempts: 1, firstAttempt: now, blocked: false, blockUntil: 0 });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 };
  }
  
  // Increment attempts
  record.attempts += 1;
  
  if (record.attempts > RATE_LIMIT_MAX_ATTEMPTS) {
    record.blocked = true;
    record.blockUntil = now + RATE_LIMIT_BLOCK_MS;
    return { allowed: false, retryAfter: RATE_LIMIT_BLOCK_MS / 1000, blocked: true };
  }
  
  rateLimitMap.set(key, record);
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - record.attempts };
}

function getClientIP(req) {
  // Try to get IP from headers (may be set by platform/proxy)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  // Fallback: use request remote address if available
  return 'unknown';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID'),
      serviceRoleKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY')
    });
    
    const clientIP = getClientIP(req);
    const url = new URL(req.url);
    let token = url.searchParams.get('token') || url.searchParams.get('share_token');
    
    if (!token) {
      try {
        const body = await req.json();
        token = body.token || body.share_token;
      } catch (e) {
        // Ignore JSON parse error
      }
    }

    if (!token) return Response.json({ error: 'Token required. Please use the full share link.' }, { status: 400 });

    // Rate limit check BEFORE any database lookups
    const rateLimit = checkRateLimit(clientIP, token);
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.retryAfter || 60;
      return Response.json(
        { 
          error: rateLimit.blocked 
            ? `Too many failed attempts. Please try again in ${Math.round(retryAfter / 60)} minutes.` 
            : 'Rate limit exceeded. Please slow down.',
          retry_after: Math.round(retryAfter)
        },
        { status: 429 }
      );
    }

    // Find active share by token
    const shares = await base44.entities.CaseShare.filter({ share_token: token });
    const share = shares.find(s => s.is_active);
    
    if (!share) {
      // Record failed attempt for rate limiting
      checkRateLimit(clientIP, token);
      return Response.json({ error: 'Share not found or expired' }, { status: 404 });
    }

    // Validate token expiry (72 hours from creation)
    const shareCreated = new Date(share.created_date);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - shareCreated.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > SHARE_TOKEN_EXPIRY_HOURS) {
      // Auto-deactivate expired share
      await base44.entities.CaseShare.update(share.id, { is_active: false });
      // Record failed attempt for rate limiting (expired tokens still count)
      checkRateLimit(clientIP, token);
      return Response.json({ error: 'This share link has expired. Please request a new link from the case owner.' }, { status: 410 });
    }

    // Update last_viewed
    await base44.entities.CaseShare.update(share.id, { last_viewed: new Date().toISOString() });

    // Fetch case
    const cases = await base44.entities.Case.filter({ id: share.case_id });
    const caseItem = cases[0];
    if (!caseItem) return Response.json({ error: 'Case not found' }, { status: 404 });

    // Fetch related data (read-only, no sensitive details)
    const deadlines = await base44.entities.Deadline.filter({ case_id: share.case_id });
    const timelineEvents = await base44.entities.TimelineEvent.filter({ case_id: share.case_id });
    const checklistItems = await base44.entities.ChecklistItem.filter({ case_id: share.case_id });
    const evidence = await base44.entities.Evidence.filter({ case_id: share.case_id });

    // Return safe subset — no complaint letter, no complainant personal details
    return Response.json({
      success: true,
      share: {
        recipient_name: share.recipient_name,
        case_id: share.case_id
      },
      case: {
        id: caseItem.id,
        title: caseItem.title,
        category: caseItem.category,
        status: caseItem.status,
        organisation_name: caseItem.organisation_name,
        incident_date: caseItem.incident_date,
        issue_summary: caseItem.issue_summary,
        desired_outcome: caseItem.desired_outcome,
        response_deadline: caseItem.response_deadline,
        escalation_body: caseItem.escalation_body,
        priority: caseItem.priority,
        created_date: caseItem.created_date
      },
      deadlines: deadlines.map(d => ({
        id: d.id, title: d.title, deadline_date: d.deadline_date,
        deadline_type: d.deadline_type, status: d.status, responsibility: d.responsibility
      })),
      timeline: timelineEvents.map(e => ({
        id: e.id, title: e.title, description: e.description,
        event_type: e.event_type, event_date: e.event_date, is_action_required: e.is_action_required
      })),
      checklist: {
        total: checklistItems.length,
        complete: checklistItems.filter(i => i.status === 'complete').length,
        items: checklistItems.map(i => ({
          id: i.id, label: i.label, category: i.category, status: i.status
        }))
      },
      evidence_count: evidence.length,
      evidence_types: [...new Set(evidence.map(e => e.file_type).filter(Boolean))]
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});