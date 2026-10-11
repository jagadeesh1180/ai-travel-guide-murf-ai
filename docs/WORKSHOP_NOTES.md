# Workshop notes and validation checklist

The source Notion page linked in the project request could not be retrieved by the environment. This repository was implemented from the workshop title and requested services (Gemini + Murf AI), so validate it against the official workshop instructions before calling it a step-for-step workshop reproduction.

## Verify before demo

- [ ] Rotate any API credentials that were pasted into chat, and use the replacements only in local/server environment variables.
- [ ] Confirm the currently supported Gemini model and REST request format in the official Google Gemini API docs.
- [ ] Confirm the current Murf endpoint, voice ID, required headers, response JSON, and chosen model version in the official Murf API docs.
- [ ] Run `npm install` and `npm run check`.
- [ ] Start with `npm start` and test `GET /api/health`.
- [ ] Test both successful calls and expected failures (missing keys, invalid input, provider quota errors).
- [ ] Verify destination-specific claims, prices, opening times, transport schedules, and entry requirements from official sources.
- [ ] Configure server-side secrets and request limits before any public deployment.

## Important integration detail

AI provider APIs can evolve. The backend intentionally avoids exposing credentials and hides raw provider error payloads from browser users. If a provider changes the endpoint/field names, update the adapter in `server.js` using its current official documentation rather than putting the key in frontend code.
