// main.js — bootstrap for Ember Duel: wires buttons, keyboard and the game loop,
// and stages screenshot states (?shot=title|table|win|loss) for the maker's own shots.

import { createGame, startGame, playCard, endTurn, canPlay } from './game.js';
import { renderGame } from './ui.js';
import * as sfx from './audio.js';

const game = createGame();
window.__emberDuel = game; // play-test hook: lets an automated check drive the game

function render() {
  renderGame(game, { onPlayCard: handlePlayCard, onEndTurn: handleEndTurn });
}

function handlePlayCard(card) {
  if (!canPlay(game, card)) return;
  const result = playCard(game, card.uid);
  if (!result.ok) return;
  if (result.card.effect.damage) sfx.playDamageSound();
  else if (result.card.effect.shield) sfx.playShieldSound();
  else if (result.card.effect.heal) sfx.playHealSound();
  else sfx.playCardSound();
  if (result.surged) sfx.playSurgeSound();
  if (game.screen === 'win') sfx.playWinSound();
  if (game.screen === 'loss') sfx.playLoseSound();
  render();
}

async function handleEndTurn() {
  if (game.phase !== 'player') return;
  sfx.playClickSound();
  await endTurn(game, render);
  if (game.screen === 'table') sfx.playTurnSound();
  if (game.screen === 'win') sfx.playWinSound();
  if (game.screen === 'loss') sfx.playLoseSound();
  render();
}

function startNewGame() {
  const fresh = createGame();
  Object.assign(game, fresh);
  startGame(game);
  sfx.playCardSound();
  render();
}

function stageScreenshot(shot) {
  startGame(game);
  if (shot === 'title') {
    Object.assign(game, createGame());
  } else if (shot === 'table') {
    // A lively mid-game table: play two of your cards, let the Warden answer once.
    const affordable = game.player.hand.filter((c) => c.cost <= game.player.ember);
    for (const card of affordable.slice(0, 2)) playCard(game, card.uid);
    game.ai.life = 19;
    game.player.life = 24;
    game.player.shield = 4;
    game.turn = 4;
    game.log.push('Turn 4: the table is hot — Flame SURGE is one card away.');
  } else if (shot === 'win') {
    game.ai.life = 0;
    game.screen = 'win';
    game.phase = 'over';
    game.turn = 9;
    game.log.push('The Cinder Warden crumbles to ash. You win!');
  } else if (shot === 'loss') {
    game.player.life = 0;
    game.screen = 'loss';
    game.phase = 'over';
    game.turn = 8;
    game.log.push('Your ember fades. The Warden wins this duel.');
  }
  render();
}

function wireButtons() {
  document.getElementById('startBtn').addEventListener('click', startNewGame);
  document.getElementById('howBtn').addEventListener('click', () => {
    document.getElementById('howPanel').classList.toggle('hidden');
    sfx.playClickSound();
  });
  document.getElementById('endTurnBtn').addEventListener('click', handleEndTurn);
  document.getElementById('muteBtn').addEventListener('click', (e) => {
    sfx.setMuted(!sfx.isMuted());
    e.currentTarget.textContent = sfx.isMuted() ? '🔇 SOUND OFF' : '🔊 SOUND ON';
  });
  for (const id of ['winAgainBtn', 'lossAgainBtn']) {
    document.getElementById(id).addEventListener('click', startNewGame);
  }
  document.getElementById('winTitleBtn').addEventListener('click', () => {
    Object.assign(game, createGame());
    render();
  });
  document.getElementById('lossTitleBtn').addEventListener('click', () => {
    Object.assign(game, createGame());
    render();
  });
}

function wireKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (game.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); startNewGame(); return; }
    if (game.screen === 'table') {
      if (e.key >= '1' && e.key <= '7') {
        const card = game.player.hand[Number(e.key) - 1];
        if (card) handlePlayCard(card);
      } else if (e.key === 'e' || e.key === 'E') {
        handleEndTurn();
      }
    }
    if ((game.screen === 'win' || game.screen === 'loss') && e.key === 'r') startNewGame();
    if (e.key === 'm' || e.key === 'M') {
      sfx.setMuted(!sfx.isMuted());
      document.getElementById('muteBtn').textContent = sfx.isMuted() ? '🔇 SOUND OFF' : '🔊 SOUND ON';
    }
  });
}

wireButtons();
wireKeyboard();

const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) stageScreenshot(shot);
else render();
