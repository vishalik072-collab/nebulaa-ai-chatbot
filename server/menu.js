// One menu used by the website widget and WhatsApp, so both give identical answers. No AI needed.
// Text style: a short heading line ending with ":" then lines starting with "- " (bullets) or "1." (steps).
import { COURSES, CONTACT, INTERNSHIP, INTERN_FIELDS } from './knowledge.js';

const GROUPS = { programming: 'Programming & Data', network: 'Networking & Cloud', design: 'Design & Web', accounts: 'Accounts & Office', office: 'Computer Basics & Office' };
const o = (id, label) => ({ id, label });
const L = (...lines) => lines.join('\n');
const MAIN = [o('courses', 'Courses'), o('intern', 'Internships'), o('fees', 'Fees & admission'), o('place', 'Location & contact'), o('more', 'More')];
const cats = () => Object.entries(GROUPS).map(([k, v]) => o('cat:' + k, v));
const wa = () => (process.env.WHATSAPP_NUMBER || '').replace(/\D/g, '');
const HOME = o('main', 'Main menu');

export function menu(id = 'main') {
  const [key, arg] = String(id).split(':');
  switch (key) {
    case 'courses':
      return { text: 'We offer 20 courses in 5 areas. Please choose one:', options: [...cats(), HOME] };
    case 'cat': {
      if (!GROUPS[arg]) break;
      const items = COURSES.map((c, i) => ({ ...c, i })).filter((c) => c.group === arg)
        .map((c) => ({ id: 'course:' + c.i, title: c.name, desc: c.blurb }));
      return { text: GROUPS[arg] + ':', items, options: [o('courses', 'Other categories'), HOME] };
    }
    case 'course': {
      const c = COURSES[+arg];
      if (!c) break;
      return { text: L(c.name + ':', '- ' + c.blurb, '- Fee, duration and batch: confirmed by the admission team'),
        options: [o('enquiry:' + arg, 'Enquire about this course'), o('courses', 'Other courses'), HOME] };
    }
    case 'intern': {
      const apply = o('enquiry:intern', 'Apply now'), back = o('intern', 'Back');
      const known = INTERN_FIELDS.filter(([k]) => INTERNSHIP[k] && k !== 'howToApply');
      const unknown = INTERN_FIELDS.filter(([k]) => !INTERNSHIP[k] && k !== 'howToApply');
      if (arg === 'domains')
        return { text: L('Internship and project domains:', ...INTERNSHIP.domains.map((d) => '- ' + d)), options: [apply, back, HOME] };
      if (arg === 'paid')
        return { text: INTERNSHIP.stipend ? L('Paid or unpaid:', '- ' + INTERNSHIP.stipend)
          : L('Paid or unpaid:', '- Not published online', '- The admission team confirms stipend and fee details for each internship'),
        options: [apply, o('intern:details', 'Duration & eligibility'), back] };
      if (arg === 'details')
        return { text: L(...(known.length ? ['Internship details:', ...known.map(([k, l]) => `- ${l}: ${INTERNSHIP[k]}`), ''] : []),
          ...(unknown.length ? ['Confirmed by the admission team:', ...unknown.map(([, l]) => '- ' + l)] : [])),
        options: [apply, o('intern:apply', 'How to apply'), back] };
      if (arg === 'apply')
        return { text: L('How to apply:', '1. Choose your domain', '2. Submit an enquiry with your name and phone number', '3. The admission team confirms availability and eligibility',
          ...(INTERNSHIP.howToApply ? ['', INTERNSHIP.howToApply] : [])), options: [apply, back, HOME] };
      return { text: L('Training at Nebulaa:', '- In-plant training (IPT)', '- Project training', '- Domains: networking, cloud, security, Android and more'),
        options: [o('intern:domains', 'Domains'), o('intern:paid', 'Paid or unpaid?'), o('intern:details', 'Duration & eligibility'), apply, HOME] };
    }
    case 'fees':
    case 'admissions':
      return { text: L('Fees:', '- Course fees are not published online', '- The admission team confirms fee and batch details', '', 'Admission steps:', '1. Select a course', '2. Submit an enquiry', '3. The admission team confirms eligibility and batch'),
        options: [o('enquiry', 'Submit enquiry'), o('courses', 'Browse courses'), HOME] };
    case 'place':
    case 'location':
    case 'contact':
      return { text: L('Nebulaa Institute of Technology', CONTACT.address, '', `Mobile: ${CONTACT.phoneLabel}`, `Email: ${CONTACT.email}`),
        links: [{ label: 'Map', primary: true, href: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Nebulaa Institute of Technology, ' + CONTACT.address) },
          { label: 'Call', href: 'tel:' + CONTACT.phone },
          ...(wa() ? [{ label: 'WhatsApp', href: 'https://wa.me/' + wa() }] : []),
          { label: 'Email', href: 'mailto:' + CONTACT.email }],
        options: [o('enquiry', 'Submit enquiry'), HOME] };
    case 'more':
      return { text: 'What would you like to know?', options: [o('workshops', 'Workshops'), o('career', 'Career guidance'), o('enquiry', 'Submit enquiry'), HOME] };
    case 'workshops':
      return { text: L('Workshops for engineering colleges:', '- Networking on MNC', '- Network Simulator 2', '- Network Security', '- Mobile Computing', '- Soft skills and placement activities'),
        options: [o('enquiry', 'Request a workshop'), HOME] };
    case 'career':
      return { text: 'Select your area of interest:', options: [...cats(), HOME] };
  }
  return { text: 'How may I help you?', options: MAIN };
}

const KEYWORDS = { course: 'courses', courses: 'courses', fee: 'fees', fees: 'fees', admission: 'fees', admissions: 'fees', location: 'place', address: 'place', contact: 'place',
  internship: 'intern', internships: 'intern', intern: 'intern', paid: 'intern:paid', unpaid: 'intern:paid', stipend: 'intern:paid', 'paid internship': 'intern:paid',
  workshop: 'workshops', workshops: 'workshops', career: 'career' };
export const keyword = (t) => KEYWORDS[String(t).toLowerCase().replace(/[^a-z ]/g, '').trim()];

// ---------- Tamil versions of the fixed answers (course names stay in English) ----------
const DOM_TA = { 'Data Mining': 'டேட்டா மைனிங்', 'Mobile Computing': 'மொபைல் கம்ப்யூட்டிங்', 'Computer Networking': 'கம்ப்யூட்டர் நெட்வொர்க்கிங்', 'Wireless and Communication Systems': 'வயர்லெஸ் மற்றும் தகவல் தொடர்பு அமைப்புகள்',
  'Network Security': 'நெட்வொர்க் செக்யூரிட்டி', 'Cloud Computing': 'கிளவுட் கம்ப்யூட்டிங்', 'Software Engineering': 'மென்பொருள் பொறியியல்', 'Distributed Systems': 'டிஸ்ட்ரிபியூட்டட் சிஸ்டம்ஸ்',
  'Image Processing': 'இமேஜ் பிராசசிங்', 'Information Security': 'தகவல் பாதுகாப்பு', 'Web Mining': 'வெப் மைனிங்', 'Grid Computing': 'கிரிட் கம்ப்யூட்டிங்', Android: 'ஆண்ட்ராய்டு' };
const TA = {
  Courses: 'படிப்புகள்', Internships: 'இன்டர்ன்ஷிப்', 'Fees & admission': 'கட்டணம் & சேர்க்கை', 'Location & contact': 'முகவரி & தொடர்பு', More: 'மேலும்', 'Main menu': 'முதன்மை பட்டி',
  'Other categories': 'மற்ற வகைகள்', 'Other courses': 'மற்ற படிப்புகள்', 'Enquire about this course': 'இந்தப் படிப்பு பற்றி விசாரிக்க', Domains: 'துறைகள்', 'Paid or unpaid?': 'சம்பளம் உண்டா?',
  'Duration & eligibility': 'காலம் & தகுதி', 'Apply now': 'இப்போதே விண்ணப்பிக்க', Back: 'பின்னால்', 'How to apply': 'எப்படி விண்ணப்பிப்பது', 'Submit enquiry': 'விசாரணை அனுப்ப', 'Browse courses': 'படிப்புகளைப் பார்க்க',
  Workshops: 'பயிலரங்குகள்', 'Career guidance': 'தொழில் வழிகாட்டுதல்', 'Request a workshop': 'பயிலரங்கு கோர', Map: 'வரைபடம்', Call: 'அழைக்க', Email: 'மின்னஞ்சல்',
  'Programming & Data': 'புரோகிராமிங் & டேட்டா', 'Networking & Cloud': 'நெட்வொர்க்கிங் & கிளவுட்', 'Design & Web': 'டிசைன் & வெப்', 'Accounts & Office': 'கணக்கு & அலுவலகம்', 'Computer Basics & Office': 'கணினி அடிப்படை & அலுவலகம்',
  'Select a course category:': 'ஒரு படிப்பு வகையைத் தேர்ந்தெடுக்கவும்:', 'How may I help you?': 'நான் எப்படி உதவலாம்?', 'What would you like to know?': 'நீங்கள் என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?',
  '- Fee, duration and batch: confirmed by the admission team': '- கட்டணம், காலம், பேட்ச் விவரங்களை சேர்க்கை குழு உறுதிப்படுத்தும்',
  'Training at Nebulaa:': 'நெபுலாவில் பயிற்சி:', '- In-plant training (IPT)': '- இன்-பிளான்ட் பயிற்சி (IPT)', '- Project training': '- புராஜெக்ட் பயிற்சி', '- Domains: networking, cloud, security, Android and more': '- துறைகள்: நெட்வொர்க்கிங், கிளவுட், செக்யூரிட்டி, ஆண்ட்ராய்டு மற்றும் பல',
  'Internship and project domains:': 'இன்டர்ன்ஷிப் மற்றும் புராஜெக்ட் துறைகள்:', 'Paid or unpaid:': 'சம்பளம் உண்டா, இல்லையா:', '- Not published online': '- இணையத்தில் வெளியிடப்படவில்லை',
  '- The admission team confirms stipend and fee details for each internship': '- ஒவ்வொரு இன்டர்ன்ஷிப்பிற்கும் ஊக்கத்தொகை மற்றும் கட்டண விவரங்களை சேர்க்கை குழு உறுதிப்படுத்தும்',
  'Internship details:': 'இன்டர்ன்ஷிப் விவரங்கள்:', 'Confirmed by the admission team:': 'சேர்க்கை குழு உறுதிப்படுத்தும் விவரங்கள்:', '- Duration': '- காலம்', '- Eligibility': '- தகுதி', '- Fee': '- கட்டணம்',
  '- Paid / stipend': '- சம்பளம் / ஊக்கத்தொகை', '- Certificate': '- சான்றிதழ்', '- Mode': '- முறை (ஆன்லைன் / ஆஃப்லைன்)', '- Batch dates': '- பேட்ச் தேதிகள்',
  'How to apply:': 'விண்ணப்பிக்கும் முறை:', '1. Choose your domain': '1. உங்கள் துறையைத் தேர்ந்தெடுக்கவும்', '2. Submit an enquiry with your name and phone number': '2. உங்கள் பெயர் மற்றும் தொலைபேசி எண்ணுடன் விசாரணை அனுப்பவும்',
  '3. The admission team confirms availability and eligibility': '3. இடம் உள்ளதா, தகுதி உள்ளதா என்பதை சேர்க்கை குழு உறுதிப்படுத்தும்',
  'Fees:': 'கட்டணம்:', '- Course fees are not published online': '- படிப்புக் கட்டணம் இணையத்தில் வெளியிடப்படவில்லை', '- The admission team confirms fee and batch details': '- கட்டணம் மற்றும் பேட்ச் விவரங்களை சேர்க்கை குழு உறுதிப்படுத்தும்',
  'Admission steps:': 'சேர்க்கை படிகள்:', '1. Select a course': '1. ஒரு படிப்பைத் தேர்ந்தெடுக்கவும்', '2. Submit an enquiry': '2. விசாரணை அனுப்பவும்', '3. The admission team confirms eligibility and batch': '3. தகுதி மற்றும் பேட்சை சேர்க்கை குழு உறுதிப்படுத்தும்',
  'Nebulaa Institute of Technology': 'நெபுலா இன்ஸ்டிடியூட் ஆஃப் டெக்னாலஜி',
  'Workshops for engineering colleges:': 'பொறியியல் கல்லூரிகளுக்கான பயிலரங்குகள்:', '- Networking on MNC': '- MNC-யில் நெட்வொர்க்கிங்', '- Network Simulator 2': '- நெட்வொர்க் சிமுலேட்டர் 2', '- Network Security': '- நெட்வொர்க் செக்யூரிட்டி',
  '- Mobile Computing': '- மொபைல் கம்ப்யூட்டிங்', '- Soft skills and placement activities': '- சாஃப்ட் ஸ்கில்ஸ் மற்றும் வேலைவாய்ப்புப் பயிற்சிகள்', 'Select your area of interest:': 'உங்கள் ஆர்வமுள்ள துறையைத் தேர்ந்தெடுக்கவும்:' };
for (const [en, ta] of Object.entries(DOM_TA)) TA['- ' + en] = '- ' + ta;
for (const g of Object.values(GROUPS)) TA[g + ':'] = (TA[g] || g) + ':';
const tl = (s) => TA[s] || (s.startsWith('Mobile:') ? 'மொபைல்:' + s.slice(7) : s.startsWith('Email:') ? 'மின்னஞ்சல்:' + s.slice(6) : s);
export function menuLang(id, lang) {
  const x = menu(id);
  if (lang !== 'ta') return x;
  return { ...x, text: x.text.split('\n').map(tl).join('\n'), options: x.options?.map((q) => ({ ...q, label: TA[q.label] || q.label })), links: x.links?.map((l) => ({ ...l, label: TA[l.label] || l.label })) };
}

// ---------- spoken versions (English): what the voice assistant says out loud, always ending with a next step ----------
const sp = (s) => s.replace(/\.$/, '');
const andList = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a.at(-1) : a[0] || '');
export function menuV(id) {
  const x = menu(id), [key, arg] = String(id).split(':'), areas = Object.values(GROUPS);
  const tapOr = (btn, say) => `Tap ${btn} on the screen, or say '${say}'.`;
  let v = '';
  if (key === 'courses' || key === 'career') v = `We offer ${COURSES.length} courses in five areas: ${andList(areas)}. Tap an area on the screen, or say its name.`;
  else if (key === 'cat' && x.items) v = `In ${GROUPS[arg]}, we offer ${andList(x.items.map((i) => i.title))}. Tap a course on the screen, or say its name, to hear the details.`;
  else if (key === 'course' && COURSES[+arg]) { const c = COURSES[+arg]; v = `${c.name}. ${sp(c.blurb)}. Fee, duration and batch details are confirmed by the admission team. ${tapOr('Enquire about this course', 'enquire')}`; }
  else if (key === 'fees' || key === 'admissions') v = `Course fees are not published online. The admission team confirms fee and batch details. To join, send an enquiry. ${tapOr('Submit enquiry', 'submit enquiry')}`;
  else if (key === 'place' || key === 'location' || key === 'contact') v = `We are at ${CONTACT.address}. You can call ${CONTACT.phoneLabel} or email ${CONTACT.email}. Tap Map for directions, or say 'submit enquiry' to send a request.`;
  else if (key === 'more') v = 'I can tell you about workshops, career guidance, or take an enquiry. Tap one on the screen, or tell me which.';
  else if (key === 'workshops') v = `We conduct workshops for engineering colleges on networking, network simulator two, network security, mobile computing, and soft skills and placement activities. ${tapOr('Request a workshop', 'enquire')}`;
  else if (key === 'intern' && !arg) v = 'We offer in-plant training and project training, in areas like networking, cloud, security and Android. Tap Domains, Paid or unpaid, Duration and eligibility, or Apply now. Or just tell me what you would like to know.';
  else if (key === 'intern' && arg === 'domains') v = `Our internship and project domains are ${andList(INTERNSHIP.domains)}. ${tapOr('Apply now', 'apply now')}`;
  else if (key === 'intern' && arg === 'paid') v = (INTERNSHIP.stipend ? sp(INTERNSHIP.stipend) + '.' : 'Whether an internship is paid is not published online. The admission team confirms stipend and fee details for each internship.') + ` ${tapOr('Apply now', 'apply now')}`;
  else if (key === 'intern' && arg === 'apply') v = `To apply, choose your domain, send an enquiry with your name and phone number, and the admission team will confirm availability and eligibility. ${tapOr('Apply now', 'apply now')} I will guide you through the form.`;
  else if (key === 'intern' && arg === 'details') {
    const known = INTERN_FIELDS.filter(([k]) => INTERNSHIP[k] && k !== 'howToApply').map(([k, l]) => `${l} is ${INTERNSHIP[k]}`);
    v = (known.length ? known.join('. ') + '. The remaining details are confirmed by the admission team.' : 'Duration, eligibility, fee, stipend, certificate, mode and batch dates are confirmed by the admission team.') + ` ${tapOr('Apply now', 'apply now')}`;
  } else if (x.text === 'How may I help you?') v = 'How may I help you? You can tap a button, or tell me what you need, for example courses, internships, fees, or our location.';
  return v ? { ...x, voice: v } : x;
}
