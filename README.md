# best-flight-game-20261126-0057-v1

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/mohamad824/best-flight-game-20261126-0057-v1/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/mohamad824/best-flight-game-20261126-0057-v1/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

**DANGER ZONE — Carrier Fighter School.** A real-time 3D carrier fighter game built with Three.js (vendored locally, no network at runtime). Fly for VF-77 SUNSET FALCONS off the fictional carrier USS AURORA (CVN-88) at golden hour: three sorties — a ring run through the island canyon, an intercept against bandits closing on the carrier, and a wire-trap carrier landing — ending in a three-phase ace duel against NIGHTHAWK.

The jet is real 3D geometry (lathed fuselage, swept wings, canted twin tails, glass canopy, glowing afterburner), and so are the people: the pilot sits in the 3D cockpit — helmet, visor, oxygen mask, hands on the stick and throttle — and a 3D deck crew in coloured vests works the carrier deck, led by a marshaller with red wands.

Flying rewards discipline: low speed stalls, hard turns bleed speed and build G, fuel burns with throttle, and damage comes from enemy fire, terrain, and the sea. Between sorties, pick 1 of 3 hangar upgrades. Score chases a CHAIN multiplier; the HUD shows ALT/SPD/HDG tapes, fuel, hull, G, throttle, and an incoming-bandit roster.

## Run it

Serve `game/` with any static server and open `index.html` in a desktop browser:

```sh
cd game
python3 -m http.server 8000
# open http://localhost:8000/
```

No build step, no network requests — every script, image, sound and font is local or generated in code. Sounds are synthesised with WebAudio.

## Controls

- **W / S** — throttle up / down
- **← / →** — bank and turn (mouse steers too)
- **↑ / ↓** — pitch
- **SPACE** (or mouse click) — guns
- **SHIFT** — afterburner
- **C** — cockpit / chase camera
- **P** — pause · **M** — mute
