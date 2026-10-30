# PRD Summary — Jelajah AI Travel Planner

## Product decisions
- Coverage: Indonesia-wide; data completeness varies.
- Trip duration: 1–5 days.
- Interaction: form-first with AI assistance.
- Auth: guest preview; login required to save.
- Budget: user selects included cost categories; presets and custom amount.
- Transport: AI recommends best available mode from route/time/cost evidence.
- Map: hybrid provider strategy with one primary map renderer.
- Itinerary: automatic generation and manual editing.
- Worship categories: mosque, musala, church, pura, vihara, kelenteng, and other mapped categories.
- Visual: emerald, cognac, warm cream, forest green.

## MVP scope
- Trip setup and preferences.
- Place search/details with provenance.
- Interactive map with selected place markers.
- Itinerary generation with structured output.
- Routing and schedule validation.
- Budget calculator with selected categories.
- Manual edit and per-day regenerate.
- Auth, saved trips, version history, PDF export.
- Error handling and mobile responsive UI.

## Non-goals
- Guaranteed live pricing.
- Direct booking/payment.
- Turn-by-turn navigation.
- Full offline support.
- Native mobile apps.

## Quality gates
- All hard constraints tested.
- No fabricated price or route facts.
- Selected budget categories only are included in total.
- All trip data protected by authorization and RLS.
- Provider failures clearly surfaced.
