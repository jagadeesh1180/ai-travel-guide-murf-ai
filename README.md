# AI Travel Guide — Gemini + Murf AI

An AI-assisted travel guide that creates destination suggestions and day-by-day itineraries with Google Gemini, then reads the guide aloud with Murf AI text-to-speech.

> Workshop note: the linked Notion workshop content was not accessible from this environment. This repository is a clean starter implementation based on the project title, not a claim to reproduce unseen workshop steps exactly.

## Features

- Responsive travel-planning interface
- Gemini-powered itinerary generation
- Murf AI text-to-speech endpoint
- API keys stay on the server in environment variables
- Input validation and useful error messages
- No hard-coded secrets

## Stack

- Node.js and Express
- Vanilla HTML, CSS, and JavaScript
- Google Gemini REST API
- Murf AI REST API

## Quick start

Requirements: Node.js 18+ and API credentials for Google Gemini and Murf.

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and add your **rotated** API keys:
   ```env
   GEMINI_API_KEY=replace_with_your_gemini_key
   MURF_API_KEY=replace_with_your_murf_key
   PORT=3000
   ```
4. Start the app:
   ```bash
   npm start
   ```
5. Visit http://localhost:3000.

## Security

- Never commit `.env` or paste API keys into source files.
- The credentials previously shared in chat should be considered exposed. Revoke/rotate them in their providers before use.
- The server forwards prompts to external AI services. Do not submit confidential or sensitive personal information.
- Apply provider rate limits and usage quotas before deploying publicly.

## API routes

- `GET /api/health` — simple server health check
- `POST /api/plan` — generate a travel plan using Gemini
- `POST /api/speech` — convert supplied text into speech using Murf

## Configuration and API notes

The integration uses provider REST APIs from the server. Provider model identifiers, request fields, and response formats can change; if a provider returns an API error, consult the current official docs and update the adapter in `server.js`.

- Gemini API: https://ai.google.dev/gemini-api/docs
- Murf API: https://docs.murf.ai/

## Project structure

```
.
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Deploy

Deploy the Node.js app to a platform that supports server-side environment variables. Configure `GEMINI_API_KEY` and `MURF_API_KEY` in the host's secret/environment settings. Do not place credentials in frontend environment variables or static assets.

## License

Choose and add a license before accepting external contributions.
