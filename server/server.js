import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SYSTEM, COURSES, CONTACT } from './knowledge.js';
import { menu, menuV, keyword } from './menu.js';

const { GEMINI_API_KEY: KEY, GEMINI_MODEL = 'gemini-3.5-flash-lite', PORT = 5000, ALLOWED_ORIGINS = '', ENQUIRY_WEBHOOK_URL,
  WHATSAPP_VERIFY_TOKEN: WA_VERIFY, WHATSAPP_TOKEN: WA_TOKEN, WHATSAPP_PHONE_ID: WA_ID, WHATSAPP_APP_SECRET: WA_SECRET, GRAPH_VERSION = 'v21.0', GRAPH_BASE = 'https://graph.facebook.com' } = process.env;
if (!KEY) { console.error('Missing GEMINI_API_KEY in .env'); process.exit(1); }
const origins = ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
const dir = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_BASE = process.env.GEMINI_BASE || 'https://generativelanguage.googleapis.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: (o, cb) => cb(null, !o || !origins.length || origins.includes(o)) }));
app.use(express.json({ limit: '100kb', verify: (req, _res, buf) => { req.raw = buf; } }));
app.use(express.static(path.join(dir, 'public')));

const hits = new Map();
const limit = (max) => (req, res, next) => {
  const k = req.ip + req.path, now = Date.now(), h = hits.get(k);
  if (!h || now > h.reset) { hits.set(k, { n: 1, reset: now + 60000 }); return next(); }
  if (++h.n > max) return res.status(429).json({ error: 'Too many requests, please slow down.' });
  next();
};

/* ---------- Gemini (auto-picks a working model if the configured one is missing) ---------- */
let model = GEMINI_MODEL;
const hint = (s) => s === 400 || s === 401 || s === 403 ? 'The Gemini API key is invalid or not allowed. Create a new key at aistudio.google.com and put it in .env.'
  : s === 404 ? 'Model not found.' : s === 429 ? 'Quota or rate limit reached. Wait a minute or check your Gemini plan.' : 'Gemini service problem.';

async function pickModel() {
  const r = await fetch(`${GEMINI_BASE}/v1beta/models?pageSize=200`, { headers: { 'x-goog-api-key': KEY } });
  if (!r.ok) throw new Error(`${r.status} ${hint(r.status)}`);
  const names = ((await r.json()).models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace('models/', '')).filter((n) => /flash/.test(n) && !/(image|tts|live|audio|thinking|exp|preview|robotics|computer|8b|omni)/.test(n))
    .sort((a, b) => (/lite/.test(b) - /lite/.test(a)) || b.localeCompare(a));
  if (!names.length) throw new Error('No usable Gemini model found for this key.');
  return names[0];
}

const VOICE_NOTE = 'VOICE MODE (these rules override the formatting rule above): your reply will be read aloud. Write one to three short plain sentences, under 40 words. Never use bullets, dashes at line starts, lists, symbols or URLs. For a long list, mention the top three items and say the full details are on the screen. In Tamil, use simple, natural, correct Tamil.';
async function gemini(history, extra = '') {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: extra ? SYSTEM + '\n\n' + extra : SYSTEM }] },
    contents: history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
    generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
  });
  let healed = false, status = 0;
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`${GEMINI_BASE}/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY }, body
    });
    if (r.ok) return ((await r.json()).candidates?.[0]?.content?.parts || []).map((p) => p.text).join('').trim();
    status = r.status;
    console.error(`Gemini error ${status} (model ${model}): ${(await r.text()).slice(0, 300)}`);
    if (status === 404 && !healed) {
      healed = true;
      try { model = await pickModel(); console.log('Switched to model:', model); } catch (e) { console.error('Could not list models:', e.message); }
      continue;
    }
    if (status === 429 || status >= 500) { await sleep(1200); continue; }
    break;
  }
  throw new Error(`${status} - ${hint(status)}`);
}

function shortenVoice(t) {
  const tags = (t.match(/\[\[[^\]]*\]\]/g) || []).join('');
  const s = t.replace(/\[\[[^\]]*\]\]/g, '').replace(/\*\*/g, '').replace(/:\s*\n+/g, ': ').replace(/^\s*(-|•|\*|\d+\.)\s+/gm, '').replace(/\s*\n+\s*/g, '. ').replace(/\.\s*\./g, '.').trim();
  const parts = s.match(/[^.!?।]+[.!?।]*/g) || [s];
  let out = '';
  for (let i = 0; i < parts.length && i < 2; i++) { if (out && (out + parts[i]).length > 300) break; out += parts[i]; }
  return (out.trim() || s.slice(0, 300)) + tags;
}
const prep = (list) => {
  const m = list.filter((x) => x && (x.role === 'user' || x.role === 'assistant') && typeof x.text === 'string' && x.text.trim())
    .map((x) => ({ role: x.role, text: x.text.slice(0, 800) }));
  while (m.length && m[0].role !== 'user') m.shift();
  return m;
};

/* ---------- Enquiries ---------- */
function saveEnquiry(e) {
  const row = { ...e, at: new Date().toISOString() };
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  fs.appendFileSync(path.join(dir, 'data', 'enquiries.jsonl'), JSON.stringify(row) + '\n');
  if (ENQUIRY_WEBHOOK_URL) fetch(ENQUIRY_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(row) }).catch((x) => console.error('Webhook failed', x.message));
}

/* ---------- Website widget API ---------- */
app.get('/api/config', (_req, res) => res.json({ courses: COURSES, contact: CONTACT }));
app.get('/api/menu/:id', (req, res) => res.json(menuV(req.params.id)));

app.post('/api/chat', limit(20), async (req, res) => {
  const msgs = prep((Array.isArray(req.body?.messages) ? req.body.messages : []).slice(-12));
  if (!msgs.length || msgs.at(-1).role !== 'user') return res.status(400).json({ error: 'No message.' });
  try {
    const voice = req.body?.voice === true, raw = (await gemini(msgs, voice ? VOICE_NOTE : '')) || 'Could you please rephrase your question?';
    res.json({ reply: voice ? shortenVoice(raw) : raw });
  }
  catch (e) { console.error('Chat failed:', e.message); res.json({ reply: 'I am unable to answer right now. Please use the menu options below.[[team]]' }); }
});

app.post('/api/enquiry', limit(5), (req, res) => {
  const { name = '', phone = '', course = '', message = '' } = req.body || {};
  const c = (s, n) => String(s).replace(/[\r\n]+/g, ' ').trim().slice(0, n);
  const e = { name: c(name, 60), phone: c(phone, 20), course: c(course, 80), message: c(message, 300), source: 'website' };
  if (e.name.length < 2 || !/^\+?[\d\s-]{8,15}$/.test(e.phone)) return res.status(400).json({ error: 'Please enter a valid name and phone number.' });
  saveEnquiry(e);
  res.json({ ok: true });
});


/* ---------- Spoken answers via Gemini text-to-speech (used when the device has no suitable voice, e.g. Tamil) ---------- */
let ttsList = process.env.GEMINI_TTS_MODEL ? [process.env.GEMINI_TTS_MODEL] : [], ttsPause = 0, ttsModel = '';
const TTS_VOICE = process.env.GEMINI_TTS_VOICE || 'Kore', ttsCache = new Map();
async function listTts() {
  const r = await fetch(`${GEMINI_BASE}/v1beta/models?pageSize=200`, { headers: { 'x-goog-api-key': KEY } });
  if (!r.ok) throw new Error(`${r.status} ${hint(r.status)}`);
  const names = ((await r.json()).models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace('models/', '')).filter((n) => /tts/.test(n))
    .sort((a, b) => (/preview/.test(a) - /preview/.test(b)) || (/flash/.test(b) - /flash/.test(a)) || b.localeCompare(a));
  if (!names.length) throw new Error('No text-to-speech model is available for this key.');
  return names;
}
function smooth(pcm, rate) {
  const total = (pcm.length >> 1) - Math.round(rate * 0.025), fo = Math.min(Math.round(rate * 0.08), total), fi = Math.min(Math.round(rate * 0.01), total);
  if (total <= 0) return pcm;
  const tail = Math.round(rate * 0.3), out = Buffer.alloc((total + tail) * 2);
  pcm.copy(out, 0, 0, total * 2);
  for (let i = 0; i < fi; i++) out.writeInt16LE(Math.round(out.readInt16LE(i * 2) * (i / fi)), i * 2);
  for (let i = 0; i < fo; i++) { const k = (total - fo + i) * 2; out.writeInt16LE(Math.round(out.readInt16LE(k) * (1 - (i + 1) / fo)), k); }
  return out;
}
function wav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
async function tts(text) {
  const key = crypto.createHash('sha1').update(TTS_VOICE + text).digest('hex');
  if (ttsCache.has(key)) return ttsCache.get(key);
  if (Date.now() < ttsPause) throw new Error('Speech quota is exhausted; waiting before trying again.');
  if (!ttsList.length) ttsList = await listTts();
  const shapes = [{ prebuiltVoiceConfig: { voiceName: TTS_VOICE } }, { voice: TTS_VOICE }];   // older and newer request styles
  let last = '', quota = 0;
  for (const m of [...ttsList]) {
    for (const voiceConfig of shapes) {
      const r = await fetch(`${GEMINI_BASE}/v1beta/models/${m}:generateContent`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig } } })
      });
      if (r.ok) {
        const part = ((await r.json()).candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
        if (!part) throw new Error('The speech model returned no audio.');
        const rate = +(/rate=(\d+)/.exec(part.inlineData.mimeType || '') || [])[1] || 24000, out = wav(smooth(Buffer.from(part.inlineData.data, 'base64'), rate), rate);
        ttsModel = m; ttsList = [m, ...ttsList.filter((x) => x !== m)];
        ttsCache.set(key, out); if (ttsCache.size > 60) ttsCache.delete(ttsCache.keys().next().value);
        return out;
      }
      last = `${r.status}: ${(await r.text()).slice(0, 160)}`;
      console.error(`TTS error ${last} (model ${m})`);
      if (r.status === 429) quota++;
      if (r.status === 400) continue;      // try the other request style
      break;                               // quota / missing model -> try the next speech model
    }
  }
  if (quota && quota >= ttsList.length) ttsPause = Date.now() + 60000;
  throw new Error(last || 'TTS failed');
}
app.post('/api/tts', limit(20), async (req, res) => {
  const text = String(req.body?.text || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!text) return res.status(400).json({ error: 'No text.' });
  try { res.set('content-type', 'audio/wav').send(await tts(text)); }
  catch (e) { console.error('Voice output failed:', e.message); res.status(502).json({ error: 'Voice output unavailable.' }); }
});

/* ---------- WhatsApp Cloud API ---------- */
const wa = new Map();
async function waSend(to, payload) {
  const r = await fetch(`${GRAPH_BASE}/${GRAPH_VERSION}/${WA_ID}/messages`, {
    method: 'POST', headers: { authorization: `Bearer ${WA_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...(to ? { to } : {}), ...payload })
  });
  if (!r.ok) console.error('WhatsApp send failed', r.status, (await r.text()).slice(0, 300));
}
const waRead = (id) => waSend('', { status: 'read', message_id: id }).catch(() => {});
const seen = new Set();
const bul = (t) => t.replace(/^- /gm, '• ');
const waText = (to, body) => waSend(to, { type: 'text', text: { body: bul(body).slice(0, 1500) } });
function waMenu(to, m) {
  const body = [m.text, ...(m.links || []).map((l) => `${l.label}: ${l.href}`)].map(bul).join('\n\n').slice(0, 1000);
  const rows = [...(m.items || []).map((i) => ({ id: i.id, title: i.title.slice(0, 24), description: i.desc.slice(0, 72) })),
    ...(m.options || []).map((o) => ({ id: o.id, title: o.label.slice(0, 24) }))].slice(0, 10);
  if (!rows.length) return waText(to, body);
  return waSend(to, { type: 'interactive', interactive: { type: 'list', body: { text: body }, action: { button: 'Choose option', sections: [{ title: 'Options', rows }] } } });
}

const waMain = (to, st) => { const first = !st.w; st.w = true; return waMenu(to, { ...menu('main'), text: first ? 'Welcome to Nebulaa Institute of Technology. How may I help you?' : 'How may I help you?' }); };

async function waHandle(m) {
  const from = m.from, st = wa.get(from) || { h: [] };
  wa.set(from, st);
  const id = m.interactive?.list_reply?.id || m.interactive?.button_reply?.id;
  const text = m.type === 'text' ? (m.text?.body || '').trim() : '';
  if (id) {
    if (id.startsWith('enquiry')) {
      const i = id.split(':')[1];
      st.enq = i === 'intern' ? 'Internship' : i !== undefined ? COURSES[+i]?.name || '' : '';
      return waText(from, st.enq === 'Internship' ? 'Please reply with your name and the internship domain you are interested in.' : st.enq ? 'Please reply with your name. Our admission team will review your enquiry.' : 'Please reply with your name and the course you are interested in.');
    }
    return waMenu(from, menu(id));
  }
  if (!text) return waMain(from, st);
  if (st.enq !== undefined) {
    const course = st.enq; delete st.enq;
    saveEnquiry({ name: text.slice(0, 60), phone: '+' + from, course, message: '', source: 'whatsapp' });
    return waText(from, 'Thank you. Your enquiry has been recorded for our admission team.\n\nReply MENU for more options.');
  }
  if (/^\s*(hi+|hello+|hey+|hai|helo|(main )?menu|start|help|vanakkam|வணக்கம்|ஹாய்|ஹலோ)\W*$/i.test(text)) return waMain(from, st);
  if (keyword(text)) return waMenu(from, menu(keyword(text)));
  st.h = prep([...st.h, { role: 'user', text }]).slice(-10);
  let reply = '';
  try { reply = await gemini(st.h); } catch (e) { console.error('WhatsApp AI failed:', e.message); }
  if (!reply) return waMenu(from, menu('contact'));
  const clean = reply.replace(/\[\[[^\]]*\]\]/g, '').trim();
  st.h.push({ role: 'assistant', text: clean });
  await waText(from, clean + '\n\nReply MENU to see options.');
}

app.get('/webhook/whatsapp', (req, res) => {
  const q = req.query;
  if (WA_VERIFY && q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === WA_VERIFY) return res.status(200).send(q['hub.challenge']);
  res.sendStatus(403);
});
app.post('/webhook/whatsapp', (req, res) => {
  if (!WA_TOKEN || !WA_ID) return res.sendStatus(503);
  if (WA_SECRET) {
    const sig = req.get('x-hub-signature-256') || '', exp = 'sha256=' + crypto.createHmac('sha256', WA_SECRET).update(req.raw || '').digest('hex');
    if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return res.sendStatus(401);
  }
  res.sendStatus(200);
  for (const e of req.body?.entry || []) for (const c of e.changes || []) for (const m of c.value?.messages || []) {
    if (!m.id || seen.has(m.id)) continue;
    seen.add(m.id); if (seen.size > 2000) seen.delete(seen.values().next().value);
    waRead(m.id);
    waHandle(m).catch((x) => console.error('WhatsApp handler error:', x.message));
  }
});

app.listen(PORT, () => {
  console.log(`Nebulaa chat running at http://localhost:${PORT}  (WhatsApp: ${WA_TOKEN && WA_ID ? 'on' : 'off'})`);
  gemini([{ role: 'user', text: 'Reply with the single word OK.' }])
    .then(() => console.log(`Gemini check: OK (model ${model})`))
    .catch((e) => console.error(`\n*** Gemini check FAILED: ${e.message}\n`));
  tts('Hello.').then(() => console.log(`Voice output check: OK (model ${ttsModel})`)).catch((e) => console.error(`Voice output check FAILED: ${e.message}`));
});
