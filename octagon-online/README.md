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

## VR (WebXR)
Open the site **in your headset's browser** (Meta Quest Browser, or Chrome/Edge with a PC headset) and tap **🥽 ENTER VR** on the menu (or **🥽 VR** in the top bar mid-match). It starts a fight vs the AI straight away; online matches work too (host or guest, VR vs flat-screen is fine).

- **Arms follow your controllers.** Your gloves are IK-driven from the controllers, and online opponents see the same arm pose.
- **Swing hard = hit hard.** Power comes from your glove's peak speed on impact (a slow poke does ~nothing, a full-speed swing is a big hit). The fighter's **Strength / Power stats multiply on top** of your swing, so a strong fighter with a weak swing still hits softer than a hard swing.
- **Dodge with your body.** Real head leaning/ducking moves your fighter's head, so punches can miss. Hands up by your head = automatic guard.
- **Controls:** left stick move (hold direction + **A** for kick variants) · right stick flick = dodge · **A** kick · **B** takedown · **X** hook · **Y** slam · grips = block · triggers = jab/cross **on the ground** · after a fight **A/X** = rematch · press **both sticks** to re-centre.
- Scoreboard floats above your opponent. Controllers only (no hand-tracking yet); quest-class headsets recommended.

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
- Online VR: the host trusts the guest's reported swing speed (capped at 14 m/s), fine for friends, not tamper-proof.

## Local run
```
npm install
npm start      # http://localhost:10000
npm test       # relay unit tests
```
