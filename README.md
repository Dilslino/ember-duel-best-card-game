# Ember Duel 🔥

**Ember Duel** is an original card duel for the make.fun best-card-game bounty: you face the **Cinder Warden** across a forge table, 30 life each, spending ember to play cards from a 24-card deck.

## How it plays

- **Each turn:** draw a card, gain 2 ember (max 10), play as many cards as your ember allows.
- **Four elements** — told apart by colour *and* shape: Flame ▲ red, Tide ● blue, Gale ◆ green, Stone ■ amber.
- **SURGE:** play two cards of the same element in one turn to trigger that element's bonus (Flame +3 damage, Tide heal 4, Gale draw 1, Stone +6 shield).
- **Cards do more than damage:** shields absorb hits first, kindling cards grant ember and draws, and the Warden AI guards when hurt, finishes you when you're low, and chases its own SURGEs.
- **Win** by reducing the Warden to 0 life. **Lose** if your ember fades first.

## Controls

Mouse/touch to play cards, or keyboard: **1–7** play a card, **E** end turn, **M** mute, **R** rematch, **Enter** start.

## Run it

Open `game/index.html` in desktop Chrome (or serve `game/` with any static server). No network requests, no build step, no libraries — vanilla JS + WebAudio bleeps synthesized in code.

## Files

- `game/index.html`, `game/styles.css` — table layout and look
- `game/src/cards.js` — the 12 card designs and the SURGE table
- `game/src/game.js` — turns, ember, draws, win/loss
- `game/src/ai.js` — the Cinder Warden's readable strategy
- `game/src/ui.js` — rendering the table, hands and overlays
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/main.js` — bootstrap, keyboard, screenshot staging
- `screenshots/` — real renders of the game (title, table, victory, defeat)
- `main.ts` — the make.fun hand-in program; `vendor/makefun-game.ts` is the kit's copy, unchanged

## License

MIT — see [LICENSE](LICENSE).
