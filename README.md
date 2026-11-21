# Nebulaa AI: Chatbot and Voice Assistant

An intelligent, tap-first chatbot with an integrated English voice assistant for **Nebulaa Institute of Technology, Trichy**. It answers questions about courses, internships, fees and admission, and the institute's location, and it collects enquiries from prospective students. It can be added to any website with a single script tag.

> Internship project by S.Vishalik gowri at Nebulaa Institute of Technology, Trichy (2026).

## Screenshots

|Floating owl button|Home screen|Instant answer|
|-|-|-|
|!\[Launcher](docs/screenshots/launcher.png)|!\[Home](docs/screenshots/home.png)|!\[Answer](docs/screenshots/answer.png)|

|Voice assistant|Spoken answer|Enquiry by voice|
|-|-|-|
|!\[Voice idle](docs/screenshots/voice-idle.png)|!\[Voice answer](docs/screenshots/voice-answer.png)|!\[Voice form](docs/screenshots/voice-form.png)|

## Features

**Chatbot**

* Floating owl button that opens a clean "pearl glass" chat panel; works on desktop and mobile
* Tap-first design: visitors can get answers without typing
* Instant, accurate answers for courses (20 courses in 5 areas), internships, fees and admission, workshops, location and contact
* Small talk ("hi", "how are you", "thank you") and AI answers (Google Gemini) for open questions
* Never invents unpublished facts: fees and internship terms are shown as "confirmed by the admission team"
* Enquiry form with validation; enquiries are stored on the server and can be forwarded to a webhook
* WhatsApp Cloud API webhook (menu lists, AI replies, enquiries); needs Meta setup before going live

**Voice assistant (English)**

* Tap the mic, speak at your own pace, tap again to send (optional Auto-send for fast speakers)
* Spoken answers that always say what to do next ("Tap Apply now on the screen, or say 'apply now'")
* Voice commands: apply now, enquire, go back, repeat, main menu, cancel
* Enquiry form on the voice screen, filled by voice with the phone number read back for confirmation
* Full-screen page (`/voice.html`) for kiosks and phones

## Tech stack

Node.js, Express, vanilla JavaScript (Shadow DOM widget), Google Gemini API, Web Speech API, WhatsApp Cloud API.

## Project structure

```
.
├── start.bat                 Windows one-click start
├── WHATSAPP-SETUP.md         Step-by-step WhatsApp setup
└── server/
    ├── server.js             API, AI gateway, speech service, WhatsApp webhook
    ├── menu.js               Instant answers (shared by website and WhatsApp)
    ├── knowledge.js          Institute facts, AI rules, internship details
    ├── package.json
    ├── .env.example          Copy to .env and fill in
    └── public/
        ├── widget.js         The whole chat + voice interface
        ├── voice.html        Full-screen voice assistant page
        ├── demo.html         Demo page with the owl button
        └── logo.png
```

## Getting started

Requirements: **Node.js 18 or newer** and **Google Chrome** (needed for voice input).

```bash
cd server
npm install
copy .env.example .env      # on Mac/Linux: cp .env.example .env
```

Open `server/.env` and set your Gemini API key (get one at https://aistudio.google.com):

```
GEMINI\_API\_KEY=your-key-here
```

Then start the server:

```bash
npm start
```

* Chatbot demo: http://localhost:5000/demo.html
* Voice assistant: http://localhost:5000/voice.html

On Windows you can also double-click `start.bat`.

## Add it to a website

```html
<script src="https://YOUR-SERVER/widget.js" defer></script>
```

Set `ALLOWED\_ORIGINS` in `.env` to your website address so that only your site can use the server.

## Configuration (`server/.env`)

|Variable|Purpose|
|-|-|
|`GEMINI\_API\_KEY`|Google Gemini API key (required)|
|`GEMINI\_MODEL`|Chat model (a working model is chosen automatically if it is unavailable)|
|`PORT`|Server port (default 5000)|
|`ALLOWED\_ORIGINS`|Websites allowed to use the chatbot|
|`ENQUIRY\_WEBHOOK\_URL`|Optional: every enquiry is also sent here|
|`WHATSAPP\_\*`|Optional WhatsApp settings (see `WHATSAPP-SETUP.md`)|

## API

|Endpoint|Purpose|
|-|-|
|`GET /api/config`|Course list and contact details|
|`GET /api/menu/:id`|Instant answer for a menu item|
|`POST /api/chat`|AI answer|
|`POST /api/enquiry`|Save an enquiry|
|`POST /api/tts`|Spoken audio (fallback voice)|
|`GET/POST /webhook/whatsapp`|WhatsApp Cloud API webhook|

## Updating the institute's information

Edit `server/knowledge.js`. Internship details (duration, eligibility, stipend, certificate, mode, batch dates, how to apply) are empty until the institute confirms them; once filled in they appear in the chatbot automatically.

## Known limitations

* Fees and internship terms are not published by the institute, so the assistant refers users to the admission team
* Voice input needs Chrome and an internet connection; phones need HTTPS
* The voice assistant is English only
* Enquiries are saved to `server/data/enquiries.jsonl`; use the webhook or a database for production
* WhatsApp needs a verified Meta business account and a public HTTPS server

## Security notes

* Never commit `server/.env` (it is listed in `.gitignore`)
* Requests are rate limited, inputs are validated, and WhatsApp messages are verified with a signature

## License

To be decided together with Nebulaa Institute of Technology.

