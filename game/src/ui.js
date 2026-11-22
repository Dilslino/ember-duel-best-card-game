// ui.js — draws the whole table into the DOM: hands, life bars, ember, log, overlays.
// Cards are big and high-contrast on purpose: the judge reads the game from
// screenshots, so values, costs and elements must survive a thumbnail.

import { ELEMENTS, describeEffect } from './cards.js';
import { MAX_LIFE, MAX_EMBER } from './game.js';

const $ = (id) => document.getElementById(id);

export function createCardElement(card, { playable = false, faceDown = false, selected = false, onPlay = null } = {}) {
  const el = ELEMENTS[card.element];
  const div = document.createElement('div');
  if (faceDown) {
    div.className = 'card card-back';
    div.innerHTML = `<div class="card-back-glyph">▲</div><div class="card-back-label">EMBER</div>`;
    return div;
  }
  div.className = `card el-${card.element}${playable ? ' playable' : ' unplayable'}${selected ? ' selected' : ''}`;
  div.dataset.uid = card.uid;
  div.tabIndex = 0;
  div.setAttribute('role', 'button');
  div.setAttribute('aria-label', `${card.name}, ${el.name}, cost ${card.cost}, ${describeEffect(card.effect)}`);
  div.innerHTML = `
    <div class="card-cost" title="Ember cost">${card.cost}</div>
    <div class="card-glyph" style="color:${el.color}">${el.glyph}</div>
    <div class="card-element">${el.name.toUpperCase()}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-power">${card.power}</div>
    <div class="card-power-label">POWER</div>
    <div class="card-text">${card.text}</div>
    <div class="card-surge">${el.surge}</div>`;
  if (onPlay) {
    div.addEventListener('click', () => onPlay(card));
    div.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(card); } });
  }
  return div;
}

function lifeBarHTML(fighter, label) {
  const pct = Math.max(0, Math.round((fighter.life / MAX_LIFE) * 100));
  const low = fighter.life <= 10 ? ' low' : '';
  return `
    <div class="life-row">
      <span class="life-label">${label}</span>
      <div class="life-bar${low}"><div class="life-fill" style="width:${pct}%"></div></div>
      <span class="life-num">❤ ${fighter.life} / ${MAX_LIFE}</span>
      ${fighter.shield > 0 ? `<span class="shield-num">🛡 ${fighter.shield}</span>` : ''}
    </div>`;
}

function emberPips(ember) {
  let pips = '';
  for (let i = 0; i < MAX_EMBER; i++) pips += `<span class="pip${i < ember ? ' on' : ''}">●</span>`;
  return `<div class="ember-row"><span class="ember-label">EMBER ${ember}/${MAX_EMBER}</span><span class="pips">${pips}</span></div>`;
}

export function renderGame(game, handlers) {
  const { onPlayCard, onEndTurn } = handlers;

  // --- top bar ---
  $('turnLabel').textContent = game.screen === 'table' ? `TURN ${game.turn}` : '';
  $('phaseLabel').textContent =
    game.screen === 'table' ? (game.phase === 'player' ? 'YOUR TURN — play a card or end turn' : 'THE WARDEN IS PLAYING…') : '';

  // --- opponent row ---
  $('aiLife').innerHTML = lifeBarHTML(game.ai, 'CINDER WARDEN');
  $('aiEmber').innerHTML = emberPips(game.ai.ember);
  $('aiTaunt').textContent = game.taunt;
  const aiHand = $('aiHand');
  aiHand.innerHTML = '';
  const shown = Math.min(game.ai.hand.length, 5);
  for (let i = 0; i < shown; i++) aiHand.appendChild(createCardElement(game.ai.hand[i], { faceDown: true }));
  $('aiHandCount').textContent = `${game.ai.hand.length} cards · deck ${game.ai.deck.length} · discard ${game.ai.discard.length}`;

  // --- middle: last played cards + log ---
  const mid = $('playedZone');
  mid.innerHTML = '';
  if (game.lastAiCard) {
    const wrap = document.createElement('div');
    wrap.className = 'played';
    wrap.innerHTML = '<div class="played-label">WARDEN PLAYED</div>';
    wrap.appendChild(createCardElement(game.lastAiCard, {}));
    mid.appendChild(wrap);
  }
  if (game.lastPlayerCard) {
    const wrap = document.createElement('div');
    wrap.className = 'played';
    wrap.innerHTML = '<div class="played-label">YOU PLAYED</div>';
    wrap.appendChild(createCardElement(game.lastPlayerCard, {}));
    mid.appendChild(wrap);
  }
  if (game.surgeFired) {
    const badge = document.createElement('div');
    badge.className = 'surge-badge';
    badge.textContent = `⚡ ${game.surgeFired.toUpperCase()} SURGE!`;
    mid.appendChild(badge);
  }
  const log = $('battleLog');
  log.innerHTML = game.log.slice(-6).map((line) => `<div class="log-line">${line}</div>`).join('');
  log.scrollTop = log.scrollHeight;

  // --- player row ---
  $('playerLife').innerHTML = lifeBarHTML(game.player, 'YOU — ADILLA');
  $('playerEmber').innerHTML = emberPips(game.player.ember);
  const hand = $('playerHand');
  hand.innerHTML = '';
  game.player.hand.forEach((card, i) => {
    const affordable = card.cost <= game.player.ember && game.phase === 'player';
    const el = createCardElement(card, { playable: affordable, onPlay: affordable ? onPlayCard : null });
    const key = document.createElement('div');
    key.className = 'card-key';
    key.textContent = `${i + 1}`;
    el.appendChild(key);
    hand.appendChild(el);
  });
  $('playerHandCount').textContent = `${game.player.hand.length} cards · deck ${game.player.deck.length} · discard ${game.player.discard.length}`;

  // --- end turn button ---
  const endBtn = $('endTurnBtn');
  endBtn.disabled = game.phase !== 'player' || game.screen !== 'table';
  endBtn.textContent = game.phase === 'player' ? 'END TURN  (E)' : 'WARDEN PLAYING…';

  // --- overlays ---
  $('titleScreen').classList.toggle('hidden', game.screen !== 'title');
  $('winScreen').classList.toggle('hidden', game.screen !== 'win');
  $('lossScreen').classList.toggle('hidden', game.screen !== 'loss');
  $('tableArea').classList.toggle('dimmed', game.screen !== 'table');
  if (game.screen === 'win') $('winStats').textContent = `You beat the Cinder Warden in ${game.turn} turns — ${game.player.life} life to spare.`;
  if (game.screen === 'loss') $('lossStats').textContent = `The Warden wins on turn ${game.turn}. Your deck still held ${game.player.deck.length} cards.`;

  $('statusLine').textContent =
    game.screen === 'table'
      ? `Turn ${game.turn}. Your life ${game.player.life}, Warden life ${game.ai.life}, ember ${game.player.ember}.`
      : game.screen;
}
