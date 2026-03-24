const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzSPQFe2au71M3PIXhQOblkj6AUhmLs1zsmqnLCEftMepNSDLWcEjcgB_G1GAFy2E6j/exec';

const analytics = {
  sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  startedAtMs: Date.now(),
  languageSelected: false,
  language: '',
  roleSelected: false,
  role: '',
  dialogueChoiceClicks: 0,
  choiceClicksByText: {},
  reachedEnd: false,
  emailLeft: false,
  dialogueTimeSeconds: 0,
  totalTimeSeconds: 0,
};

function toFormEncoded(payload) {
  return new URLSearchParams(
    Object.entries(payload).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
  ).toString();
}

function sendGetBeacon(payload) {
  if (!WEBAPP_URL) return;
  const qs = new URLSearchParams(
    Object.entries(payload).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
  ).toString();
  const img = new Image();
  img.src = `${WEBAPP_URL}?${qs}`;
}

async function post(payload) {
  if (!WEBAPP_URL) return;
  // Reliable delivery path for GitHub Pages + Apps Script.
  sendGetBeacon(payload);
  try {
    await fetch(WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: toFormEncoded(payload),
    });
  } catch (_) {
    // Silent fail: GET beacon already sent above.
  }
}

export function setDialogueTime(seconds) {
  analytics.dialogueTimeSeconds = Math.max(0, Number(seconds) || 0);
}

export function trackEvent(type, payload = {}) {
  const now = Date.now();
  analytics.totalTimeSeconds = Math.floor((now - analytics.startedAtMs) / 1000);

  if (type === 'language_selected') {
    analytics.languageSelected = true;
    analytics.language = payload.language || analytics.language;
  }
  if (type === 'role_selected') {
    analytics.roleSelected = true;
    analytics.role = payload.role || analytics.role;
  }
  if (type === 'dialogue_choice_clicked') {
    analytics.dialogueChoiceClicks += 1;
    const key = payload.choiceText || 'unknown';
    analytics.choiceClicksByText[key] = (analytics.choiceClicksByText[key] || 0) + 1;
  }
  if (type === 'reached_end') {
    analytics.reachedEnd = true;
  }
  if (type === 'email_submitted') {
    analytics.emailLeft = true;
  }

  void post({
    mode: 'event',
    session_id: analytics.sessionId,
    event_type: type,
    event_ts: new Date(now).toISOString(),
    payload,
  });
}

export function buildSummary(extra = {}) {
  return {
    session_id: analytics.sessionId,
    language_selected: analytics.languageSelected,
    language: analytics.language || '',
    role_selected: analytics.roleSelected,
    role: analytics.role || '',
    dialogue_time_seconds: analytics.dialogueTimeSeconds,
    dialogue_choice_clicks: analytics.dialogueChoiceClicks,
    unique_choice_count: Object.keys(analytics.choiceClicksByText).length,
    reached_end: analytics.reachedEnd,
    email_submitted: analytics.emailLeft,
    total_time_seconds: analytics.totalTimeSeconds,
    ...extra,
  };
}

export function flushSummary(extra = {}) {
  const now = Date.now();
  analytics.totalTimeSeconds = Math.floor((now - analytics.startedAtMs) / 1000);
  void post({
    mode: 'summary',
    summary: buildSummary(extra),
    updated_ts: new Date(now).toISOString(),
  });
}

export function submitEmail(email, extra = {}) {
  const now = Date.now();
  analytics.emailLeft = true;
  analytics.totalTimeSeconds = Math.floor((now - analytics.startedAtMs) / 1000);

  void post({
    mode: 'email',
    session_id: analytics.sessionId,
    email,
    submitted_ts: new Date(now).toISOString(),
    ...extra,
  });

  flushSummary(extra);
}
