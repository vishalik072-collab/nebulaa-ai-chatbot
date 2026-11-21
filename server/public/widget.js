/* Nebulaa AI floating chat widget (pearl glass). Embed: <script src="https://YOUR-SERVER/widget.js" defer></script> */
(() => {
  const API = new URL(document.currentScript.src).origin, KEY = 'nebulaa-chat-v3', FULL = document.currentScript.dataset.mode === 'voice';
  const KW = { course: 'courses', courses: 'courses', fee: 'fees', fees: 'fees', admission: 'fees', admissions: 'fees', location: 'place', address: 'place', contact: 'place', internship: 'intern', internships: 'intern', intern: 'intern',
    workshop: 'workshops', workshops: 'workshops', career: 'career', paid: 'intern:paid', unpaid: 'intern:paid', stipend: 'intern:paid', 'paid internship': 'intern:paid' };
  const MENU = /^\s*(go (to )?(the )?)?(main )?(menu|home)\s*$|^\s*(start over|start|help)\s*$/i;
  // Spoken questions are matched to a ready answer (instant, no AI needed). Most specific first.
  const INTENTS = [[/\b(paid|unpaid|stipend|salary)\b/i, 'intern:paid'], [/(duration|how long|eligib|who can|qualification).*\bintern|\bintern.*(duration|how long|eligib|who can|qualification)/i, 'intern:details'],
    [/how (do|can) i apply|how to apply|application process|\bapply (for|to) (the )?intern/i, 'intern:apply'], [/\bdomains?\b/i, 'intern:domains'], [/\bintern(ship|ships)?\b/i, 'intern'],
    [/\b(ccna|cisco)\b/i, 'course:7'], [/\b(cyber|ethical hacking|hacking)\b/i, 'course:6'], [/\b(cloud|aws)\b/i, 'course:8'], [/\bgraphic/i, 'course:9'], [/\b(web design|web designing|animation)\b/i, 'course:10'],
    [/\bgst\b/i, 'course:13'], [/\btally\b/i, 'course:19'], [/\b(linux|windows admin)\b/i, 'course:14'], [/\b(rhcsa|rhce|red hat)\b/i, 'course:15'], [/\bmcsa\b/i, 'course:16'], [/\.net|dot ?net/i, 'course:17'],
    [/ms project|microsoft project/i, 'course:18'], [/\b(dca|diploma in computer)\b/i, 'course:2'], [/\b(basic computer|ms office|microsoft office)\b/i, 'course:1'], [/\bdigital literacy\b/i, 'course:3'], [/\bexcel\b/i, 'course:4'],
    [/\b(python|java|c\+\+|coding|programming|data science|developer)\b/i, 'cat:programming'], [/\b(accounting|accounts|finance)\b/i, 'cat:accounts'], [/\b(networking|network)\b/i, 'cat:network'], [/\b(design|designing)\b/i, 'cat:design'],
    [/\b(fee|fees|cost|price|charges?|how much|duration|how long|batch|timings?|schedule)\b/i, 'fees'], [/\b(admission|admissions|join|enrol+|enroll|apply)\b/i, 'fees'],
    [/(where (is|are)|located|location|address|\bmap\b|directions?|contact|phone number|email id|reach you)/i, 'place'], [/\bworkshops?\b/i, 'workshops'],
    [/\b(career|suggest a course|recommend a course|which course (is )?(best|good))\b/i, 'career'], [/\b(courses?|classes|programmes?|programs?|subjects?|what (do you|can i) (teach|learn|study))\b/i, 'courses']];
  // Spoken navigation commands (voice screen)
  const CMDS = [[/^\s*(please )?(go )?(back|previous)\s*$/i, 'back'], [/\b(repeat|say that again|say it again|say again|once more)\b/i, 'repeat'],
    [/\b(apply now|submit (an )?enquiry|send (an )?enquiry|make (an )?enquiry|enquire|enquiry|i want to (join|apply|enroll|enrol)|fill (in )?(the )?form|register)\b/i, 'enquiry']];
  const NUMW = { zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
  const toDigits = (t) => t.toLowerCase().replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g, (x) => NUMW[x]).replace(/double (\d)/g, '$1$1').replace(/\D/g, '');
  const smallTalk = (t) => {
    const x = t.toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim(), n = x.split(' ').length;
    if (/^(hi+|hello+|hey+|hai|helo|good (morning|afternoon|evening))( (there|nebula|nebulaa|nebular|assistant|sir|madam|mam|ma am|maam))*$/.test(x)) return { text: 'Hello! How may I help you?', options: mainOpts() };
    if (/how are you|how r u|how do you do|how'?s it going|how is it going|how are things/.test(x)) return { text: "I'm fine, thank you. What about you?" };
    if (/^(i'?m |i m |i am |am )?(fine|good|great|well|ok|okay|not bad|doing well|doing good|very good)( (thanks|thank you|and you|what about you))*$/.test(x)) return { text: 'Glad to hear that. How may I help you today?', options: mainOpts() };
    if (n <= 6 && /thank you|thanks|thank u/.test(x)) return { text: 'You are welcome. Is there anything else I can help you with?', options: mainOpts() };
    if (n <= 6 && /^(bye|goodbye|good night|see you|that is all|that'?s all|that s all)/.test(x)) return { text: 'Goodbye! Have a wonderful day.', end: true };
    if (/who are you|your name|what can you do|introduce yourself|what do you do|what is nebula/.test(x)) return { text: 'I am Nebulaa AI, the virtual assistant of Nebulaa Institute of Technology in Trichy. I can help with courses, internships, fees and admission, and our location.', options: mainOpts() };
    return null;
  };
  const ROWS = [['book', 'Courses', 'courses'], ['case', 'Internships', 'intern'], ['bill', 'Fees & admission', 'fees'], ['pin', 'Location & contact', 'place']];
  try { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'; document.head.appendChild(l); } catch {}
  const ICON = { book: '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>', case: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
    bill: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>', pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    next: '<path d="M9 6l6 6-6 6"/>', back: '<path d="M15 6l-6 6 6 6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', up: '<path d="M12 19V5M5 12l7-7 7 7"/>', mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>' };
  const svg = (n, s = 18, sw = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
  const GLASS = 'background:rgba(255,255,255,.58);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.75);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 6px 18px rgba(60,70,100,.09)';
  const PEARL = 'radial-gradient(110% 60% at 88% 6%,#fff 0%,rgba(255,255,255,0) 58%),radial-gradient(90% 55% at 6% 34%,#CDD4E4 0%,rgba(205,212,228,0) 62%),radial-gradient(100% 60% at 75% 100%,#BDC6DA 0%,rgba(189,198,218,0) 66%),#E4E7EF';
  const CSS = `
  :host{all:initial}*{box-sizing:border-box;font-family:Inter,system-ui,-apple-system,"Segoe UI","Noto Sans Tamil",sans-serif}
  .w{--ink:#1B1026;--mu:#5A5468;--ac:#4A2560;position:fixed;right:20px;bottom:20px;z-index:2147483000;font-size:14px;line-height:1.5;color:var(--ink)}
  button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}[hidden]{display:none!important}
  .fab{position:relative;width:66px;height:66px;border-radius:50%;background:#fff;border:2px solid var(--ac);display:grid;place-items:center;box-shadow:0 10px 26px rgba(74,37,96,.32);animation:fl 4.5s ease-in-out infinite}
  .fab img{width:48px;height:48px;object-fit:contain;pointer-events:none}
  .fab:before{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(74,37,96,.4);animation:pl 2.8s ease-out infinite}
  .fab:after{content:"";position:absolute;right:1px;bottom:3px;width:13px;height:13px;border-radius:50%;background:#84CC16;border:2px solid #fff}
  .lab{position:absolute;right:84px;bottom:20px;padding:9px 16px;background:#271635;color:#F3EDF8;border-radius:999px;font-weight:600;font-size:13px;white-space:nowrap;box-shadow:0 6px 18px rgba(27,16,38,.2);animation:up .8s .5s both}
  .teaser{position:absolute;right:0;bottom:84px;width:216px;padding:11px 14px;background:#fff;border-radius:16px 16px 4px 16px;box-shadow:0 8px 24px rgba(27,16,38,.16);font-size:13px;animation:up .6s both}
  .panel{position:absolute;right:0;bottom:0;width:380px;max-width:calc(100vw - 24px);height:min(640px,calc(100vh - 40px));display:flex;flex-direction:column;overflow:hidden;border-radius:28px;
    background:${PEARL};
    box-shadow:0 30px 80px rgba(40,30,70,.32),inset 0 0 0 1px rgba(255,255,255,.7);animation:pop .4s cubic-bezier(.2,.8,.2,1)}
  .gl{position:absolute;top:70px;right:-40px;width:250px;height:90px;border-radius:50px;background:rgba(255,255,255,.75);filter:blur(22px);transform:rotate(-26deg);animation:dr 11s ease-in-out infinite;pointer-events:none}
  .panel>*:not(.gl){position:relative}
  .top{display:flex;align-items:center;height:56px;padding:0 6px 0 8px;flex:none}.st{flex:1;display:flex;align-items:center;gap:8px;padding-left:16px;font-size:12.5px;color:var(--mu)}.top.sub .st{padding-left:0}
  .st i{width:7px;height:7px;border-radius:50%;background:#3F9B3A}.x{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;color:var(--mu)}.x:hover{background:rgba(255,255,255,.55)}
  .home{flex:1;min-height:0;display:flex;flex-direction:column}.art{flex:1;display:grid;place-items:center;position:relative;min-height:90px}
  .mk{width:104px;height:104px;border-radius:50%;display:grid;place-items:center;${GLASS};box-shadow:inset 0 1px 0 #fff,0 14px 34px rgba(60,70,100,.16);animation:fl 5s ease-in-out infinite}.mk img{width:72px;height:72px;object-fit:contain}
  .art:after{content:"";position:absolute;left:50%;top:calc(50% + 66px);width:70px;height:10px;margin-left:-35px;border-radius:50%;background:rgba(40,30,70,.24);filter:blur(6px);animation:sh 5s ease-in-out infinite}
  .gr{margin:0;padding:0 26px 16px;font-size:27px;line-height:1.22;font-weight:400;letter-spacing:-.015em;animation:up .7s .05s both}
  .list{padding:0 16px;display:flex;flex-direction:column;gap:9px}
  .r{display:flex;align-items:center;gap:12px;width:100%;height:52px;padding:0 14px;text-align:left;border-radius:18px;font-size:14.5px;font-weight:500;${GLASS};animation:up .6s both;transition:transform .2s,box-shadow .2s}
  .r:nth-child(1){animation-delay:.18s}.r:nth-child(2){animation-delay:.28s}.r:nth-child(3){animation-delay:.38s}.r:nth-child(4){animation-delay:.48s}
  .r:hover{transform:translateY(-2px);box-shadow:inset 0 1px 0 #fff,0 12px 26px rgba(60,70,100,.18)}
  .ic{width:28px;height:28px;border-radius:9px;border:1px solid rgba(27,16,38,.2);display:grid;place-items:center;flex:none;color:var(--ac)}.r .t{flex:1}.r>svg{color:var(--mu)}
  .more{display:block;margin:6px auto 0;padding:8px 14px;font-size:13px;font-weight:500;color:var(--ac)}
  .chat{flex:1;min-height:0;display:flex}.log{flex:1;overflow-y:auto;padding:4px 16px 10px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}.log>*{flex-shrink:0}
  .m{max-width:86%;padding:10px 14px;border-radius:18px;overflow-wrap:anywhere;font-size:13.5px;animation:up .3s both}
  .bot{align-self:flex-start;border-bottom-left-radius:6px;${GLASS}}.me{align-self:flex-end;border-bottom-right-radius:6px;background:var(--ac);color:#fff}
  .gap{height:7px}.h{font-weight:600;margin-bottom:2px}.li{display:flex;gap:8px;margin-top:3px}.li i{flex:none;font-style:normal;color:var(--ac);font-weight:700}.m a{color:inherit;text-decoration:underline}
  .chips{display:flex;flex-wrap:wrap;gap:8px}.chip{padding:8px 14px;font-size:13px;font-weight:500;border-radius:999px;${GLASS};transition:transform .2s}.chip:hover{transform:translateY(-2px)}
  .cards{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:thin}.card{flex:none;width:172px;padding:12px;border-radius:16px;${GLASS};display:flex;flex-direction:column;gap:3px}
  .card b{font-size:13px}.card span{font-size:12px;color:var(--mu);flex:1}.card button{margin-top:8px;padding:8px 10px;border-radius:999px;background:var(--ac);color:#fff;font-size:12px;font-weight:600}
  .links{display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:8px}.btn{display:block;padding:10px 8px;border-radius:14px;text-align:center;font-size:13px;font-weight:600;text-decoration:none;color:var(--ac);${GLASS}}
  .btn.p,.f .btn{background:var(--ac);border-color:var(--ac);color:#fff}
  form.f{padding:14px;border-radius:18px;${GLASS};display:flex;flex-direction:column;gap:8px}
  .f input,.f select,.f textarea{width:100%;padding:10px 12px;font-size:13.5px;color:var(--ink);background:rgba(255,255,255,.75);border:1px solid rgba(27,16,38,.14);border-radius:12px;outline:0}
  .f input:focus,.f select:focus,.f textarea:focus,.in:focus-within{border-color:var(--ac)}.f .err{margin:0;font-size:12px;color:#B91C1C}
  .dots{display:flex;gap:4px;padding:13px 16px}.dots i{width:6px;height:6px;border-radius:50%;background:var(--mu);animation:bn 1.2s infinite}.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
  .in{display:flex;align-items:flex-end;gap:8px;margin:8px 16px 6px;padding:5px 5px 5px 20px;border-radius:26px;${GLASS}}
  .in textarea{flex:1;resize:none;max-height:90px;border:0;outline:0;background:none;font-size:14px;color:var(--ink);padding:8px 0}.in textarea::placeholder{color:var(--mu)}
  .send{width:38px;height:38px;flex:none;border-radius:50%;background:var(--ac);color:#fff;display:grid;place-items:center}.send:disabled{opacity:.35}
  .note{margin:0;padding:0 12px 12px;text-align:center;font-size:11px;color:var(--mu)}
  @media(max-width:480px){.w{right:12px;bottom:12px}.panel{position:fixed;inset:0;width:100%;max-width:none;height:100%;border-radius:0}.lab{display:none}}
  .mic{width:38px;height:38px;flex:none;border-radius:50%;color:var(--ac);display:grid;place-items:center}.mic:hover{background:rgba(255,255,255,.6)}
  .panel>.vo{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;border-radius:inherit;background:${PEARL}}
  .vtop{display:flex;align-items:center;justify-content:space-between;width:100%;height:56px;padding:0 6px;flex:none}.vtop .x{flex:none}
  .vt{font-size:13.5px;font-weight:500;color:var(--mu)}
  .w.full .vtop{justify-content:center}
  .vart{position:relative;margin-top:18px;width:150px;height:150px;display:grid;place-items:center;flex:none}.ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--ac);opacity:0}
  .vmk{width:116px;height:116px;border-radius:50%;display:grid;place-items:center;${GLASS};box-shadow:inset 0 1px 0 #fff,0 14px 34px rgba(60,70,100,.16)}.vmk img{width:80px;height:80px;object-fit:contain}
  .vo[data-s=listening] .ring{animation:rg 1.5s ease-out infinite}.vo[data-s=speaking] .ring{animation:rg .9s ease-out infinite;border-color:#84CC16}
  .vo[data-s=thinking] .ring{opacity:.8;border-style:dashed;animation:rot 1.6s linear infinite}.vo[data-s=speaking] .vmk{animation:fl .8s ease-in-out infinite}
  .vst{margin:16px 24px 2px;font-size:15px;font-weight:500;text-align:center}.vcap{margin:0 24px;min-height:22px;font-size:14px;color:var(--mu);font-style:italic;text-align:center}
  .vans{margin:8px 18px 0;padding:12px 14px;border-radius:18px;${GLASS};font-size:13.5px;white-space:pre-line;max-height:150px;overflow-y:auto;width:calc(100% - 36px)}.vans:empty{display:none}
  .vchips{display:flex;flex-wrap:wrap;justify-content:center;align-content:flex-start;gap:8px;margin:8px 0 0;padding:4px 16px;width:100%;flex:1;min-height:0;overflow-y:auto}
  .vbar{margin-top:auto;width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 20px 18px}.vml{font-size:12px;color:var(--mu)}a.chip{display:inline-block;text-decoration:none;color:inherit}
  .vmic{width:76px;height:76px;border-radius:50%;background:var(--ac);color:#fff;display:grid;place-items:center;box-shadow:0 12px 28px rgba(74,37,96,.35)}.vmic.on{animation:mp 1.4s ease-out infinite}
  .w.full{inset:0;display:grid;place-items:center;background:${PEARL}}.w.full .panel{position:relative;width:min(560px,100%);height:min(860px,100vh);max-width:none}
  .w.full .vart{width:210px;height:210px;margin-top:5vh}.w.full .vmk{width:164px;height:164px}.w.full .vmk img{width:116px;height:116px}.w.full .vst{font-size:17px}.w.full .vmic{width:84px;height:84px}
  .vo.ans .vart,.w.full .vo.ans .vart{width:92px;height:92px;margin-top:4px}.vo.ans .vmk,.w.full .vo.ans .vmk{width:72px;height:72px}.vo.ans .vmk img,.w.full .vo.ans .vmk img{width:50px;height:50px}.vo.ans .vst{margin-top:8px}.vo.ans .vbar{padding-bottom:16px}
  .vo.ans .vans{max-height:min(38vh,290px)}
  .w.full{grid-template-columns:minmax(0,1fr)}.panel{min-width:0}.vo{min-width:0}
  .vcap{width:calc(100% - 48px);max-height:4.6em;overflow-y:auto;overflow-wrap:anywhere}.vans{overflow-wrap:anywhere}.vchips .chip{max-width:100%}
  .vrow{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;width:100%;gap:10px}.vrow>:first-child{justify-self:start}.vrow>:last-child{justify-self:end}
  .vopt{padding:8px 12px;border-radius:999px;font-size:12.5px;font-weight:500;${GLASS}}
  .chip.pri{background:var(--ac);color:#fff;border-color:var(--ac)}
  .vo .f{width:calc(100% - 36px);margin:8px 18px 0;padding:12px}.vo .f .btn{width:100%}.vlink{padding:8px;font-size:13px;font-weight:500;color:var(--ac)}.vo.form .vans,.vo.form .vchips{display:none}
  @keyframes rg{0%{transform:scale(.85);opacity:.7}100%{transform:scale(1.35);opacity:0}}@keyframes rot{to{transform:rotate(360deg)}}@keyframes mp{0%{box-shadow:0 0 0 0 rgba(74,37,96,.45)}100%{box-shadow:0 0 0 22px rgba(74,37,96,0)}}
  @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes sh{0%,100%{transform:scaleX(1);opacity:.9}50%{transform:scaleX(.78);opacity:.45}}
  @keyframes dr{0%,100%{transform:rotate(-26deg) translate(0,0)}50%{transform:rotate(-26deg) translate(-18px,12px)}}@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes pl{0%{transform:scale(.92);opacity:.7}100%{transform:scale(1.4);opacity:0}}@keyframes pop{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}
  @keyframes bn{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-4px);opacity:1}}
  @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${CSS}</style><div class="w">
    <div class="teaser" hidden>Need help with courses or admissions?</div><div class="lab">Ask Nebulaa</div>
    <button class="fab" aria-label="Chat with Nebulaa AI"><img data-logo alt=""></button>
    <section class="panel" role="dialog" aria-label="Nebulaa AI chat" hidden><div class="gl"></div>
      <div class="top"><button class="x bk" data-a="home" aria-label="Main menu" hidden>${svg('back', 20)}</button><span class="st"><i></i>Nebulaa AI · Online 24/7</span><button class="x" data-a="close" aria-label="Close chat">${svg('x', 20)}</button></div>
      <div class="home"><div class="art"><div class="mk"><img data-logo alt=""></div></div><h1 class="gr"></h1><div class="list"></div><button class="more" data-a="more">More options</button></div>
      <div class="chat" hidden><div class="log" aria-live="polite"></div></div>
      <form class="in"><textarea rows="1" maxlength="500" placeholder="Enter message…" aria-label="Your message"></textarea><button type="button" class="mic" data-a="voice" aria-label="Speak to Nebulaa AI">${svg('mic', 20)}</button><button class="send" aria-label="Send">${svg('up', 16, 2.5)}</button></form>
      <p class="note">AI assistant. Please confirm fees and dates with the admission team.</p><div class="vo" hidden data-s="idle"><div class="vtop"><button class="x" data-a="vexit" aria-label="Back to chat">${svg('back', 20)}</button><span class="vt">Voice assistant</span><span style="width:44px"></span></div>
        <div class="vart"><div class="ring"></div><div class="vmk"><img data-logo alt=""></div></div><p class="vst" aria-live="polite">Tap the mic and speak</p><p class="vcap"></p><div class="vans"></div><div class="vchips"></div>
        <div class="vbar"><div class="vrow"><button class="vopt" data-a="auto" aria-pressed="false">Auto-send: off</button><button class="vmic" data-a="vmic" aria-label="Speak, then tap again to send">${svg('mic', 30)}</button><button class="vopt vcan" data-a="vcancel" style="visibility:hidden">Cancel</button></div><span class="vml" aria-live="polite">Tap to speak</span></div></div>
      </section></div>`;
  root.querySelectorAll('img[data-logo]').forEach((i) => { i.src = API + '/logo.png'; });
  const $ = (s) => root.querySelector(s);
  const [fab, teaser, lab, panel, top, bk, home, chat, log, form, box, send, list, gr] = ['.fab', '.teaser', '.lab', '.panel', '.top', '.bk', '.home', '.chat', '.log', 'form.in', 'textarea', '.send', '.list', '.gr'].map($);
  let msgs = [], cfg = null, busy = false;
  try { msgs = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch {} };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const put = (n) => { log.appendChild(n); log.scrollTop = log.scrollHeight; return n; };
  const getCfg = async () => cfg || (cfg = await fetch(API + '/api/config').then((r) => r.json()).catch(() => ({ courses: [], contact: {} })));
  const clearChips = () => log.querySelectorAll('.chips').forEach((c) => c.remove());

  ROWS.forEach(([i, t, id]) => {
    const b = el('button', 'r'); b.innerHTML = `<span class="ic">${svg(i, 16)}</span><span class="t"></span>${svg('next', 18)}`; b.querySelector('.t').textContent = t; b.onclick = () => pick(id, t); list.appendChild(b);
  });
  const greet = () => { const h = new Date().getHours(); return (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + ', how may I help you?'; };
  function showHome() { gr.textContent = greet(); home.hidden = false; chat.hidden = true; bk.hidden = true; top.classList.remove('sub'); }
  function showChat() {
    home.hidden = true; chat.hidden = false; bk.hidden = false; top.classList.add('sub');
    if (!log.children.length) msgs.forEach((m) => bubble(m.role === 'user' ? 'user' : 'bot', m.text));
    log.scrollTop = log.scrollHeight;
  }

  function link(node, text) {
    text.split(/(https?:\/\/[^\s)]+)/g).forEach((p, i) => {
      if (i % 2) { const a = el('a', '', p); a.href = p; a.target = '_blank'; a.rel = 'noopener'; node.appendChild(a); } else node.appendChild(document.createTextNode(p));
    });
  }
  function bubble(role, text) {
    const b = el('div', 'm ' + (role === 'user' ? 'me' : 'bot'));
    text.split('\n').forEach((line) => {
      const li = line.match(/^\s*(-|•|\d+\.)\s+(.*)$/);
      if (li) { const row = el('div', 'li'), body = el('span'); row.appendChild(el('i', '', /\d/.test(li[1]) ? li[1] : '•')); link(body, li[2]); row.appendChild(body); b.appendChild(row); }
      else { const row = el('div', !line.trim() ? 'gap' : /:\s*$/.test(line) && line.length < 60 ? 'h' : 'ln'); link(row, line); b.appendChild(row); }
    });
    return put(b);
  }
  function chips(listOf) {
    const c = el('div', 'chips');
    listOf.forEach((t) => { const b = el('button', 'chip', t); b.onclick = () => { c.remove(); say(t); }; c.appendChild(b); });
    put(c);
  }
  function render(m) {
    msgs.push({ role: 'assistant', text: m.text }); save();
    botSay(m.text, m.voice || (m.items?.length ? m.text + '\n' + m.items.map((x) => '- ' + x.title).join('\n') : m.text), m.text);
    if (m.items?.length) {
      const c = el('div', 'cards');
      m.items.forEach((x) => { const d = el('div', 'card'); d.append(el('b', '', x.title), el('span', '', x.desc)); const b = el('button', '', 'View details'); b.onclick = () => pick(x.id, x.title); d.appendChild(b); c.appendChild(d); });
      put(c);
    }
    if (m.links?.length) {
      const t = el('div', 'links');
      m.links.forEach((l) => { const a = el('a', 'btn' + (l.primary ? ' p' : ''), l.label); a.href = l.href; if (l.href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; } t.appendChild(a); });
      put(t);
    }
    if (voice.on) voice.options([...(m.items || []).map((x) => ({ id: x.id, label: x.title })), ...(m.options || [])], m.links);
    if (m.options?.length) {
      const c = el('div', 'chips');
      m.options.forEach((o) => { const b = el('button', 'chip', o.label); b.onclick = () => pick(o.id, o.label); c.appendChild(b); });
      put(c);
    }
  }
  async function enquiry(course = '') {
    const { courses } = await getCfg(), f = el('form', 'f');
    f.innerHTML = '<input name="name" placeholder="Your name" required maxlength="60" aria-label="Your name"><input name="phone" type="tel" placeholder="Phone number" required maxlength="15" aria-label="Phone number"><select name="course" aria-label="Course"></select><textarea name="message" rows="2" maxlength="300" placeholder="Anything to add? (optional)" aria-label="Message"></textarea><p class="err" hidden></p><button class="btn">Send enquiry</button>';
    const sel = f.querySelector('select');
    sel.add(new Option('Course / internship (optional)', '')); sel.add(new Option('Internship / project training', 'Internship'));
    courses.forEach((c) => sel.add(new Option(c.name, c.name)));
    sel.value = course;
    f.onsubmit = async (e) => {
      e.preventDefault(); const err = f.querySelector('.err'), data = Object.fromEntries(new FormData(f)); err.hidden = true;
      try {
        const r = await fetch(API + '/api/enquiry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error((await r.json()).error);
        f.remove(); const t = `Thank you, ${data.name}. Your enquiry is saved for our admission team.`;
        msgs.push({ role: 'assistant', text: t }); save(); botSay(t); chips(['Main menu']);
      } catch (x) { err.textContent = x.message || 'Could not send. Please try again.'; err.hidden = false; }
    };
    put(f);
  }
  async function menu(id) {
    if (id === 'enquiry' || id.startsWith('enquiry:')) {
      const n = id.split(':')[1], course = n === 'intern' ? 'Internship' : n !== undefined ? (await getCfg()).courses[+n]?.name || '' : '';
      return voice.on ? voiceEnquiry(course) : enquiry(course);
    }
    try { render(await fetch(API + '/api/menu/' + encodeURIComponent(id)).then((r) => r.json())); }
    catch { bubble('bot', 'Unable to load this option. Please try again.'); }
  }
  async function pick(id, label) {
    if (busy) return;
    if (voice.on) {
      if (id === 'main') { voice.hist = []; voice.ctx = ''; }
      else if (!/^enquiry/.test(id)) {
        voice.hist.push(id); if (voice.hist.length > 20) voice.hist.shift();
        const c = /^course:(\d+)/.exec(id);
        if (c) voice.ctx = 'enquiry:' + c[1]; else if (/^intern/.test(id)) voice.ctx = 'enquiry:intern'; else if (/^(courses|cat:|place|fees|workshops|more|career)/.test(id)) voice.ctx = '';
      }
    }
    if (id === 'main') return voice.on ? render({ text: 'How may I help you?', voice: 'How may I help you? You can tap a button, or tell me what you need, for example courses, internships, fees, or our location.', options: mainOpts() }) : showHome();
    showChat(); clearChips();
    if (label) { msgs.push({ role: 'user', text: label }); bubble('user', label); }
    await menu(id);
    if (voice.on && voice.state === 'thinking') { vstate('idle'); afterSpeak(); }
  }
  const parse = (raw) => ({ text: raw.replace(/\[\[[^\]]*\]\]/g, '').trim(), tag: (raw.match(/\[\[(courses|enquiry|team)\]\]/) || [])[1] });

  /* ---------- voice (English). Speak at your own pace, then TAP the mic to send. Optional Auto-send for fast speakers. ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, TTS = window.speechSynthesis;
  const vo = $('.vo'), vst = $('.vst'), vcap = $('.vcap'), vans = $('.vans'), vchips = $('.vchips'), vmic = $('.vmic'), vml = $('.vml'), vauto = $('.vopt[data-a=auto]'), vcan = $('.vcan');
  const voice = { fill: null, form: null, hist: [], ctx: '', last: null, on: false, auto: false, session: false, active: false, finish: false, buf: '', state: 'idle', rec: null, misses: 0, endAfter: false, tok: 0, stopSend: null };
  const mainOpts = () => ROWS.map(([, t, id]) => ({ id, label: t }));
  const VST = (s) => ({ idle: voice.auto && voice.session ? 'Listening…' : 'Tap the mic and speak', listening: voice.auto ? "Listening… I'll answer when you pause" : 'Listening… take your time', thinking: 'Thinking…', speaking: 'Speaking…' }[s]);
  const VML = (s) => ({ idle: 'Tap to speak', listening: voice.auto ? 'Pausing sends your question' : 'Tap when you finish speaking', thinking: 'One moment…', speaking: 'Tap to interrupt and speak' }[s]);
  function vstate(s, msg) {
    voice.state = s; vo.dataset.s = s; vst.textContent = msg || VST(s); vml.textContent = VML(s);
    vmic.classList.toggle('on', s === 'listening'); vcan.style.visibility = s === 'listening' ? 'visible' : 'hidden';
  }
  function vcancel() {
    voice.tok++; const r = voice.rec; voice.rec = null;
    try { r && r.abort(); } catch {} try { TTS && TTS.cancel(); } catch {} try { voice.ctl && voice.ctl.abort(); } catch {} try { if (voice.audio) { voice.audio.pause(); voice.audio = null; } } catch {}
  }
  const speakable = (t) => {
    let s = t.replace(/https?:\/\/\S+/g, '').replace(/&/g, ' and ').replace(/^\s*(-|•|\d+\.)\s*/gm, '').replace(/:\s*\n/g, '. ').replace(/\n+/g, '. ').replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();
    if (s.length > 480) { const cut = s.slice(0, 470), i = cut.lastIndexOf('. '); s = (i > 80 ? cut.slice(0, i + 1) : cut) + ' The full details are on the screen.'; }
    return s;
  };
  const pickVoice = () => { const vs = TTS.getVoices(); return vs.find((v) => /^en-IN/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)); };
  const afterSpeak = () => {
    if (voice.endAfter) { voice.endAfter = false; voice.session = false; voice.active = false; return vstate('idle'); }
    if (voice.on && voice.auto && voice.session) setTimeout(() => { if (voice.on && voice.session && voice.state === 'idle') { voice.active = true; listen(false); } }, 350);
  };
  function speakLocal(text, v) {
    const tok = ++voice.tok, parts = speakable(text).match(/[^.!?]+[.!?]*/g) || [text];
    TTS.cancel(); vstate('speaking');
    parts.forEach((p, i) => { const u = new SpeechSynthesisUtterance(p.trim()); u.voice = v; u.lang = v.lang; if (i === parts.length - 1) u.onend = () => { if (tok !== voice.tok) return; vstate('idle'); afterSpeak(); }; TTS.speak(u); });
  }
  async function speakCloud(text) {
    const tok = ++voice.tok; voice.ctl = new AbortController(); vstate('speaking', 'Preparing voice…');
    try {
      const r = await fetch(API + '/api/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: speakable(text) }), signal: voice.ctl.signal });
      if (!r.ok) throw new Error('tts');
      const a = new Audio(URL.createObjectURL(await r.blob())); voice.audio = a;
      a.onended = () => { if (tok !== voice.tok) return; voice.audio = null; vstate('idle'); afterSpeak(); };
      a.onerror = () => { if (tok !== voice.tok) return; voice.audio = null; vstate('idle', 'Voice output failed. The answer is shown on screen.'); afterSpeak(); };
      await a.play(); if (tok === voice.tok) vstate('speaking');
    } catch (e) { if (e.name === 'AbortError' || tok !== voice.tok) return; vstate('idle', 'Voice output is unavailable right now. The answer is shown on screen.'); afterSpeak(); }
  }
  function speak(text, show) {
    voice.last = [text, show]; vans.textContent = (show || text).replace(/https?:\/\/\S+/g, '').replace(/^\s*- /gm, '• ').trim(); vans.scrollTop = 0; vo.classList.add('ans');
    const v = TTS && pickVoice();
    if (!v) return speakCloud(text);
    speakLocal(text, v);
  }
  function botSay(text, spoken, show) { bubble('bot', text); if (voice.on) speak(spoken || text, show); }
  voice.options = (opts, links) => {
    vchips.textContent = '';
    (links || []).forEach((l) => { const a = el('a', 'chip', l.label); a.href = l.href; if (l.href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; } vchips.appendChild(a); });
    (opts || []).forEach((o) => { const b = el('button', 'chip' + (/^enquiry/.test(o.id) ? ' pri' : ''), o.label); b.onclick = () => { voice.active = false; voice.buf = ''; vcancel(); vstate('thinking'); pick(o.id, o.label); }; vchips.appendChild(b); });
  };
  const turn = (text) => { vstate('thinking'); if (voice.form) { vstate('idle'); fillStep(text); return; } say(text).finally(() => { if (voice.state === 'thinking') { vstate('idle'); afterSpeak(); } }); };
  function listen(keep) {
    if (!SR) { voice.active = false; return vstate('idle', 'Voice input needs Chrome or Edge. You can go back and type instead.'); }
    if (busy) return void setTimeout(() => { if (voice.active) listen(keep); }, 400);
    if (!keep) { voice.buf = ''; vcap.textContent = ''; voice.misses = 0; }
    vcancel(); voice.finish = false;
    const r = new SR(); voice.rec = r; r.lang = 'en-IN'; r.interimResults = true; r.continuous = true; r.maxAlternatives = 1;
    let seg = '', timer = null;
    const show = () => { vcap.textContent = [voice.buf, seg].filter(Boolean).join(' '); vcap.scrollTop = vcap.scrollHeight; };
    voice.stopSend = () => { clearTimeout(timer); voice.finish = true; try { r.stop(); } catch {} };
    r.onstart = () => vstate('listening');
    r.onresult = (e) => {
      let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + ' ';
      seg = t.trim(); show();
      if (voice.auto) { clearTimeout(timer); timer = setTimeout(() => voice.stopSend && voice.stopSend(), 2200); }   // only when Auto-send is on
    };
    r.onerror = (e) => {
      clearTimeout(timer); r.err = e.error;
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      const M = { 'not-allowed': 'The microphone is blocked. Allow it in the browser address bar, then tap the mic again.', 'service-not-allowed': 'The microphone is blocked. Allow it in the browser settings.',
        'audio-capture': 'No microphone was found.', network: 'Voice recognition needs an internet connection.' };
      voice.active = false; voice.session = false; vstate('idle', M[e.error] || 'Voice input failed. Tap the mic to try again.');
    };
    r.onend = () => {
      clearTimeout(timer);
      if (voice.rec !== r) return;
      voice.buf = [voice.buf, seg].filter(Boolean).join(' '); seg = '';
      if (voice.finish) { const text = voice.buf; voice.buf = ''; voice.finish = false; voice.active = false; return text ? turn(text) : vstate('idle'); }
      if (voice.active && (voice.state === 'listening' || voice.state === 'idle')) {   // the browser ended its segment on its own: keep what you said and keep listening
        if (!voice.buf && ++voice.misses >= 3) { voice.active = false; voice.session = false; return vstate('idle', "I didn't hear anything. Tap the mic to try again."); }
        setTimeout(() => { if (voice.active && voice.rec === r) listen(true); }, 250);
      }
    };
    try { r.start(); } catch { voice.active = false; vstate('idle', 'Could not start the microphone.'); }
  }
  const startListening = () => { voice.active = true; voice.session = voice.auto; listen(false); };
  const cancelListening = () => { voice.active = false; voice.session = false; voice.finish = false; voice.buf = ''; vcancel(); vcap.textContent = ''; vstate('idle'); };
  function micTap() {
    if (voice.state === 'thinking') return;
    if (voice.state === 'listening') { if (vcap.textContent.trim()) voice.stopSend && voice.stopSend(); else cancelListening(); }
    else if (voice.state === 'speaking') { vcancel(); startListening(); }
    else startListening();
  }
  function closeForm() { try { voice.form && voice.form.remove(); } catch {} voice.form = null; voice.fill = null; vo.classList.remove('form'); }
  async function voiceEnquiry(course) {
    const { courses } = await getCfg(); closeForm();
    const f = el('form', 'f');
    f.innerHTML = '<input name="name" placeholder="Your name" required maxlength="60" aria-label="Your name"><input name="phone" type="tel" inputmode="tel" placeholder="Phone number" required maxlength="15" aria-label="Phone number"><select name="course" aria-label="Course or internship"></select><p class="err" hidden></p><button class="btn">Send enquiry</button><button type="button" class="vlink">Cancel</button>';
    const sel = f.querySelector('select'); sel.add(new Option('Course / internship (optional)', '')); sel.add(new Option('Internship / project training', 'Internship')); courses.forEach((c) => sel.add(new Option(c.name, c.name))); sel.value = course || '';
    vo.insertBefore(f, vo.querySelector('.vbar')); vo.classList.add('ans', 'form'); vchips.textContent = ''; vans.textContent = ''; voice.form = f; voice.fill = 'name';
    f.querySelector('.vlink').onclick = () => { closeForm(); render({ text: 'How may I help you?', voice: 'Okay, I cancelled the enquiry. How may I help you?', options: mainOpts() }); };
    f.onsubmit = async (e) => {
      e.preventDefault(); const err = f.querySelector('.err'), data = Object.fromEntries(new FormData(f)); err.hidden = true; vcancel();
      try {
        const r = await fetch(API + '/api/enquiry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error((await r.json()).error);
        closeForm(); const t = `Thank you, ${data.name}. Your enquiry is saved for our admission team.`; msgs.push({ role: 'assistant', text: t }); save();
        render({ text: t, voice: t + ' Is there anything else I can help you with?', options: mainOpts() });
      } catch (x) { err.textContent = x.message || 'Could not send. Please check the details.'; err.hidden = false; speak('I could not send that. Please check your name and phone number on the screen, then tap Send enquiry.', 'Please check your details.'); }
    };
    speak("Let us send your enquiry. Please tap the mic and tell me your name. You can also type it on the screen.", 'Send your enquiry');
  }
  function fillStep(text) {
    const f = voice.form; if (!f) { voice.fill = null; return; }
    const say2 = (s, show) => speak(s, show || s);
    if (/^\s*(cancel|never mind|stop|go back|back)\s*$/i.test(text)) return void f.querySelector('.vlink').click();
    if (voice.fill === 'name') {
      const n = text.replace(/^(my name is|i am|i'm|this is|it is|it's)\s+/i, '').replace(/[^\p{L} .'-]/gu, '').trim().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase()).slice(0, 60);
      if (!n) return say2('I did not catch your name. Please tap the mic and say it again.');
      f.elements.name.value = n; voice.fill = 'phone'; return say2(`Thank you, ${n}. Now please tap the mic and tell me your phone number, digit by digit.`);
    }
    if (voice.fill === 'phone') {
      const d = toDigits(text).slice(0, 15);
      if (d.length < 8) return say2('I could not catch a valid phone number. Please tap the mic and say it again, digit by digit. You can also type it on the screen.');
      f.elements.phone.value = d; voice.fill = null;
      return say2(`I heard ${d.split('').join(' ')}. If that is correct, tap Send enquiry, or say 'yes, send'. If not, say 'no', or type the number on the screen.`);
    }
    if (/\b(yes|yeah|send|submit|correct|confirm|right)\b/i.test(text) && !/\b(no|not|wrong)\b/i.test(text)) return void f.requestSubmit();
    if (/\b(no|wrong|incorrect|again|change)\b/i.test(text)) { voice.fill = 'phone'; return say2('Okay. Please tap the mic and say your phone number again.'); }
    say2("Please tap Send enquiry when you are ready, or say 'yes, send'.");
  }
  function voiceOn() {
    closeForm(); voice.on = true; voice.session = false; voice.active = false; voice.buf = ''; voice.endAfter = false; vo.hidden = false; vcancel(); vcap.textContent = ''; vans.textContent = ''; vo.classList.remove('ans'); voice.options(mainOpts()); vstate('idle'); }
  function voiceOff() { closeForm(); voice.on = false; voice.session = false; voice.active = false; voice.endAfter = false; vcancel(); vo.hidden = true; }

  async function say(text) {
    text = text.trim(); if (!text || busy) return;
    box.value = '';
    if (MENU.test(text)) {
      if (!voice.on) return showHome();
      showChat(); return render({ text: 'How may I help you?', voice: 'How may I help you? You can ask about courses, internships, fees and admission, or our location.', options: mainOpts() });
    }
    const kw = KW[text.toLowerCase().replace(/[^a-z ]/g, '').trim()];
    if (kw) return pick(kw, text);
    if (voice.on) {
      const cmd = CMDS.find(([re]) => re.test(text));
      if (cmd && cmd[1] === 'repeat') { if (voice.last) speak(...voice.last); return; }
      if (cmd && cmd[1] === 'back') { voice.hist.pop(); return pick(voice.hist.pop() || 'main', text); }
      if (cmd && cmd[1] === 'enquiry') { const c = INTENTS.find(([re, id]) => /^course:/.test(id) && re.test(text)); return pick(c ? 'enquiry:' + c[1].split(':')[1] : /intern/i.test(text) ? 'enquiry:intern' : voice.ctx || 'enquiry', text); }
      const hit = INTENTS.find(([re]) => re.test(text)); if (hit) return pick(hit[1], text);
    }
    const st = smallTalk(text);
    if (st) { showChat(); clearChips(); msgs.push({ role: 'user', text }); bubble('user', text); if (st.end) voice.endAfter = true; return render(st); }
    showChat(); clearChips();
    busy = true; send.disabled = true;
    try {
    msgs.push({ role: 'user', text }); bubble('user', text);
    const dots = put(el('div', 'm bot dots')); dots.innerHTML = '<i></i><i></i><i></i>';
    let raw;
    try {
      const r = await fetch(API + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: msgs.slice(-12), voice: voice.on }) });
      raw = (await r.json()).reply || 'Sorry, something went wrong. Please try again.';
    } catch { raw = 'I could not connect just now. Please check your internet and try again.'; }
    dots.remove();
    const p = parse(raw);
    if (p.text) { msgs.push({ role: 'assistant', text: p.text }); botSay(p.text); }
    save();
    if (p.tag === 'courses') await menu('courses'); else if (p.tag === 'enquiry') await enquiry(); else if (p.tag === 'team') await menu('place');
    else { chips(['Main menu']); if (voice.on) voice.options(mainOpts()); }
    } finally { busy = false; send.disabled = false; if (!voice.on) box.focus(); }
  }

  const open = (v) => {
    if (!v) voiceOff();
    panel.hidden = !v; fab.hidden = v; lab.hidden = v; teaser.hidden = true;
    if (v) { if (msgs.length) showChat(); else showHome(); }
    if (!FULL) try { sessionStorage.setItem(KEY + '-open', v ? '1' : ''); } catch {}
  };
  fab.onclick = () => open(true);
  panel.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'close') open(false);
    if (a === 'voice') { voiceOn(); startListening(); }
    if (a === 'vexit') voiceOff();
    if (a === 'vmic') micTap();
    if (a === 'vcancel') cancelListening();
    if (a === 'auto') { voice.auto = !voice.auto; vauto.textContent = 'Auto-send: ' + (voice.auto ? 'on' : 'off'); vauto.setAttribute('aria-pressed', String(voice.auto)); if (!voice.auto) voice.session = false; vstate(voice.state); }
    if (a === 'home') showHome();
    if (a === 'more') pick('more', 'More options');
  });
  form.onsubmit = (e) => { e.preventDefault(); say(box.value); };
  box.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); say(box.value); } };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden && !FULL) open(false); });
  if (FULL) { $('.w').classList.add('full'); root.querySelectorAll('[data-a=close],[data-a=vexit]').forEach((b) => { b.hidden = true; }); open(true); voiceOn(); }
  else try { if (sessionStorage.getItem(KEY + '-open')) open(true); else if (!msgs.length) setTimeout(() => { if (panel.hidden) teaser.hidden = false; }, 4000); } catch {}
})();
