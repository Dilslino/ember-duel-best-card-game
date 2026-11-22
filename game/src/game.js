// game.js — the rules of Ember Duel: turns, ember, draws, SURGE combos, win/loss.
// You vs the Cinder Warden. Both start at 30 life. Each turn: +2 ember (max 10),
// draw 1 card, play as many cards as your ember allows. Two cards of the same
// element in one turn trigger that element's SURGE. First life total to 0 loses.

import { buildDeck, shuffleDeck, surgeBonus } from './cards.js';
import { chooseAiPlays, aiTaunt } from './ai.js';

export const MAX_LIFE = 30;
export const MAX_EMBER = 10;
export const MAX_HAND = 7;
export const START_EMBER = 3;

export function newFighter(isAi) {
  return {
    isAi,
    life: MAX_LIFE,
    shield: 0,
    ember: START_EMBER,
    deck: shuffleDeck(buildDeck()),
    hand: [],
    discard: [],
  };
}

export function createGame() {
  return {
    screen: 'title', // title | table | win | loss
    turn: 0,
    phase: 'idle', // idle | player | ai | over
    player: newFighter(false),
    ai: newFighter(true),
    playedElements: [],
    surgeFired: null,
    log: [],
    lastPlayerCard: null,
    lastAiCard: null,
    aiPlays: [],
    taunt: 'The Cinder Warden studies your hand.',
    winner: null,
  };
}

function drawCard(fighter, log) {
  if (fighter.deck.length === 0) {
    if (fighter.discard.length === 0) return null;
    fighter.deck = shuffleDeck([...fighter.discard]);
    fighter.discard = [];
    log.push('Deck reshuffled from the discard pile.');
  }
  const card = fighter.deck.pop();
  if (fighter.hand.length < MAX_HAND) fighter.hand.push(card);
  else fighter.discard.push(card);
  return card;
}

export function startGame(game) {
  game.screen = 'table';
  game.phase = 'player';
  game.turn = 1;
  game.log = ['The duel begins. You hold the first ember.'];
  game.playedElements = [];
  game.surgeFired = null;
  game.winner = null;
  for (let i = 0; i < 5; i++) drawCard(game.player, game.log);
  for (let i = 0; i < 5; i++) drawCard(game.ai, game.log);
  game.taunt = aiTaunt(game.ai.life, game.player.life);
}

export function startPlayerTurn(game) {
  game.turn += 1;
  game.phase = 'player';
  game.playedElements = [];
  game.surgeFired = null;
  game.player.ember = Math.min(MAX_EMBER, game.player.ember + 2);
  const drawn = drawCard(game.player, game.log);
  game.log.push(`Turn ${game.turn}: you draw${drawn ? ` ${drawn.name}` : ' nothing'} and gain 2 ember.`);
}

function applyEffect(game, source, target, effect, label) {
  const parts = [];
  if (effect.damage) {
    let dmg = effect.damage;
    const absorbed = Math.min(target.shield, dmg);
    target.shield -= absorbed;
    dmg -= absorbed;
    target.life = Math.max(0, target.life - dmg);
    parts.push(`${dmg} damage${absorbed ? ` (${absorbed} blocked)` : ''}`);
  }
  if (effect.shield) { source.shield += effect.shield; parts.push(`+${effect.shield} shield`); }
  if (effect.heal) { source.life = Math.min(MAX_LIFE, source.life + effect.heal); parts.push(`+${effect.heal} life`); }
  if (effect.ember) { source.ember = Math.min(MAX_EMBER, source.ember + effect.ember); parts.push(`+${effect.ember} ember`); }
  if (effect.draw) {
    for (let i = 0; i < effect.draw; i++) drawCard(source, game.log);
    parts.push(`draw ${effect.draw}`);
  }
  game.log.push(`${label}: ${parts.join(', ')}.`);
  return parts;
}

export function canPlay(game, card) {
  return game.phase === 'player' && game.screen === 'table' && card.cost <= game.player.ember;
}

// Returns { ok, surged } or { ok: false, reason }.
export function playCard(game, cardUid) {
  if (game.phase !== 'player' || game.screen !== 'table') return { ok: false, reason: 'Not your turn.' };
  const idx = game.player.hand.findIndex((c) => c.uid === cardUid);
  if (idx < 0) return { ok: false, reason: 'Card not in hand.' };
  const card = game.player.hand[idx];
  if (card.cost > game.player.ember) return { ok: false, reason: 'Not enough ember.' };

  game.player.hand.splice(idx, 1);
  game.player.discard.push(card);
  game.player.ember -= card.cost;
  game.lastPlayerCard = card;

  const hadElement = game.playedElements.includes(card.element);
  game.playedElements.push(card.element);
  applyEffect(game, game.player, game.ai, card.effect, `You play ${card.name}`);

  let surged = false;
  if (hadElement && !game.surgeFired) {
    game.surgeFired = card.element;
    surged = true;
    const bonus = surgeBonus(card.element);
    applyEffect(game, game.player, game.ai, bonus, `SURGE ${card.element.toUpperCase()}!`);
  }
  checkEnd(game);
  return { ok: true, surged, card };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The Warden takes its turn, one card at a time so you can read its plan.
export async function runAiTurn(game, onUpdate) {
  game.phase = 'ai';
  game.ai.ember = Math.min(MAX_EMBER, game.ai.ember + 2);
  drawCard(game.ai, game.log);
  game.log.push(`The Warden draws and gains 2 ember.`);
  game.taunt = aiTaunt(game.ai.life, game.player.life);
  onUpdate();
  await wait(650);

  const { plays } = chooseAiPlays(game.ai.hand, game.ai.ember, game.ai.life, game.player.life, game.player.shield);
  game.aiPlays = plays;
  const playedElements = [];
  let surgeDone = false;
  for (const card of plays) {
    if (game.screen !== 'table') break;
    const idx = game.ai.hand.findIndex((c) => c.uid === card.uid);
    if (idx < 0) continue;
    game.ai.hand.splice(idx, 1);
    game.ai.discard.push(card);
    game.ai.ember -= card.cost;
    game.lastAiCard = card;
    applyEffect(game, game.ai, game.player, card.effect, `Warden plays ${card.name}`);
    if (playedElements.includes(card.element) && !surgeDone) {
      surgeDone = true;
      applyEffect(game, game.ai, game.player, surgeBonus(card.element), `Warden SURGE ${card.element.toUpperCase()}!`);
    }
    playedElements.push(card.element);
    onUpdate();
    checkEnd(game);
    if (game.screen !== 'table') return;
    await wait(750);
  }
  if (plays.length === 0) game.log.push('The Warden passes — no card it could afford.');
  await wait(400);
  if (game.screen === 'table') startPlayerTurn(game);
  onUpdate();
}

function checkEnd(game) {
  if (game.ai.life <= 0 && game.player.life <= 0) {
    game.screen = 'win'; game.phase = 'over'; game.winner = 'player';
    game.log.push('Both flames die together — but yours burns last. You win!');
  } else if (game.ai.life <= 0) {
    game.screen = 'win'; game.phase = 'over'; game.winner = 'player';
    game.log.push('The Cinder Warden crumbles to ash. You win!');
  } else if (game.player.life <= 0) {
    game.screen = 'loss'; game.phase = 'over'; game.winner = 'ai';
    game.log.push('Your ember fades. The Warden wins this duel.');
  }
}

export function endTurn(game, onUpdate) {
  if (game.phase !== 'player' || game.screen !== 'table') return Promise.resolve();
  game.log.push('You end your turn.');
  return runAiTurn(game, onUpdate);
}
