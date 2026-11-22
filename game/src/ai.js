// ai.js — the Cinder Warden: an opponent whose choices you can read and counter.
// It plays greedily but telegraphs its plan: it guards when hurt, spends big when
// you are low, and always chases a same-element SURGE when one is in reach.

import { surgeBonus } from './cards.js';

export function chooseAiPlays(hand, ember, selfLife, playerLife, playerShield) {
  const affordable = hand.filter((c) => c.cost <= ember);
  const plays = [];
  let remaining = ember;

  const byDamage = (a, b) => (b.effect.damage || 0) - (a.effect.damage || 0);
  const byShield = (a, b) => (b.effect.shield || 0) - (a.effect.shield || 0);

  // 1. Hurt and in danger: shield first.
  if (selfLife <= 12) {
    for (const card of [...affordable].sort(byShield)) {
      if (card.effect.shield && card.cost <= remaining) {
        plays.push(card); remaining -= card.cost;
      }
    }
  }

  // 2. You are almost beaten: finish with the biggest damage available.
  if (playerLife + playerShield <= 10) {
    for (const card of [...affordable].sort(byDamage)) {
      if (card.effect.damage && card.cost <= remaining && !plays.includes(card)) {
        plays.push(card); remaining -= card.cost;
      }
    }
  }

  // 3. Chase a SURGE: a second card of an element already played this turn.
  const playedElements = plays.map((c) => c.element);
  for (const card of affordable) {
    if (plays.includes(card) || card.cost > remaining) continue;
    if (playedElements.includes(card.element)) {
      plays.push(card); remaining -= card.cost; playedElements.push(card.element);
    }
  }

  // 4. Otherwise spend leftover ember on damage, then on value (draw / ember).
  const rest = affordable
    .filter((c) => !plays.includes(c))
    .sort((a, b) => {
      const score = (c) => (c.effect.damage || 0) * 2 + (c.effect.draw || 0) * 3 + (c.effect.ember || 0) * 2 + (c.effect.shield || 0);
      return score(b) - score(a);
    });
  for (const card of rest) {
    if (card.cost <= remaining) { plays.push(card); remaining -= card.cost; }
  }

  return { plays, surge: surgeBonusFor(plays) };
}

function surgeBonusFor(plays) {
  const seen = new Set();
  for (const card of plays) {
    if (seen.has(card.element)) return surgeBonus(card.element);
    seen.add(card.element);
  }
  return null;
}

export function aiTaunt(selfLife, playerLife) {
  if (selfLife <= 8) return 'The Warden\'s flame gutters… it fights to stay lit.';
  if (playerLife <= 8) return 'The Warden smells victory and presses the attack.';
  if (playerLife <= 15) return 'The Warden circles, embers rising.';
  return 'The Cinder Warden studies your hand.';
}
