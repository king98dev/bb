# Octagon MMA — Online

Your game, now with online 1v1 (plus spectators), ready for Render.

## Deploy on Render (≈3 minutes)
1. Push this folder to a GitHub repo.
2. Render dashboard → **New → Blueprint** → pick the repo (it reads `render.yaml`).
   *(Or **New → Web Service**: Build `npm install`, Start `npm start`, Health check `/healthz`.)*
3. Open the `https://….onrender.com` URL → **ONLINE MULTIPLAYER**.

## Playing
- **Quick Match** pairs you with the next person searching.
- **Create Private Room** gives a 4-letter code + invite link (`?room=ABCD`). Friends open it, pick a fighter, press JOIN.
- Each player brings their own fighter from their saved roster. Host = RED (left), guest = BLUE (right).
- A 3rd+ person joining a full room spectates.
- If the guest leaves, the AI takes over their fighter; a new guest can join the same room.

## How it works
The host's browser runs the existing fight simulation (so every move, takedown and submission behaves exactly as in single player).
The guest sends button presses; the host streams poses at ~30 Hz plus sound/effect events; the guest interpolates ~110 ms behind.
The Node server (`server.js` + `rooms.js`) only pairs players and relays messages.

## Things to know
- **Host keeps the tab open and in front** — a backgrounded host tab pauses the fight.
- Render's **free plan sleeps after ~15 min idle** (first visit takes ~30–60 s to wake). Use a paid instance for always-on.
- Rooms live in memory; a redeploy/restart ends active fights.
- Fighter stats from guests are clamped to the same ranges as the in-game editor.
- The in-fight Editor button is hidden online.

## Local run
```
npm install
npm start      # http://localhost:10000
npm test       # relay unit tests
```
