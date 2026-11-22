// cards.js — every card in Ember Duel: its element, cost, power and effect.
// Four elements, told apart by colour AND shape, never by text alone:
//   Flame ▲ red · Tide ● blue · Gale ◆ green · Stone ■ amber.
// Playing two cards of the same element in one turn triggers a SURGE bonus.

export const ELEMENTS = {
  flame: { name: 'Flame', glyph: '▲', color: '#e5484d', dark: '#8f1d22', surge: 'SURGE: +3 damage' },
  tide:  { name: 'Tide',  glyph: '●', color: '#3b82f6', dark: '#1d4ed8', surge: 'SURGE: heal 4 life' },
  gale:  { name: 'Gale',  glyph: '◆', color: '#22a06b', dark: '#14532d', surge: 'SURGE: draw 1 card' },
  stone: { name: 'Stone', glyph: '■', color: '#d97706', dark: '#92400e', surge: 'SURGE: +6 shield' },
};

export const ELEMENT_ORDER = ['flame', 'tide', 'gale', 'stone'];

// effect: { damage, shield, heal, ember, draw } — any subset, all numbers >= 0.
const CARD_DEFS = [
  { id: 'ember-strike', name: 'Ember Strike', element: 'flame', cost: 2, power: 5, effect: { damage: 5 }, text: 'Deal 5 damage.' },
  { id: 'wildfire',     name: 'Wildfire',     element: 'flame', cost: 4, power: 9, effect: { damage: 9 }, text: 'Deal 9 damage.' },
  { id: 'flame-lash',   name: 'Flame Lash',   element: 'flame', cost: 1, power: 3, effect: { damage: 3 }, text: 'Deal 3 damage.' },
  { id: 'tidal-crash',  name: 'Tidal Crash',  element: 'tide',  cost: 3, power: 6, effect: { damage: 6, heal: 2 }, text: 'Deal 6 damage. Heal 2.' },
  { id: 'deep-current', name: 'Deep Current', element: 'tide',  cost: 2, power: 4, effect: { damage: 4, draw: 1 }, text: 'Deal 4 damage. Draw 1.' },
  { id: 'mist-veil',    name: 'Mist Veil',    element: 'tide',  cost: 2, power: 6, effect: { shield: 6 }, text: 'Gain 6 shield.' },
  { id: 'gale-rush',    name: 'Gale Rush',    element: 'gale',  cost: 2, power: 4, effect: { damage: 4, draw: 1 }, text: 'Deal 4 damage. Draw 1.' },
  { id: 'thorn-whip',   name: 'Thorn Whip',   element: 'gale',  cost: 3, power: 7, effect: { damage: 7 }, text: 'Deal 7 damage.' },
  { id: 'windfall',     name: 'Windfall',     element: 'gale',  cost: 1, power: 2, effect: { ember: 2 }, text: 'Gain 2 ember.' },
  { id: 'stonewall',    name: 'Stonewall',    element: 'stone', cost: 2, power: 8, effect: { shield: 8 }, text: 'Gain 8 shield.' },
  { id: 'boulder',      name: 'Boulder Throw', element: 'stone', cost: 3, power: 6, effect: { damage: 6 }, text: 'Deal 6 damage.' },
  { id: 'quarry',       name: 'Quarry Song',  element: 'stone', cost: 1, power: 2, effect: { ember: 2, draw: 1 }, text: 'Gain 2 ember. Draw 1.' },
];

export function buildDeck() {
  const deck = [];
  for (const def of CARD_DEFS) {
    deck.push({ ...def, effect: { ...def.effect }, uid: `${def.id}-a` });
    deck.push({ ...def, effect: { ...def.effect }, uid: `${def.id}-b` });
  }
  return deck; // 24 cards, two copies of each of the 12 designs
}

export function shuffleDeck(deck, random = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function surgeBonus(element) {
  switch (element) {
    case 'flame': return { damage: 3 };
    case 'tide':  return { heal: 4 };
    case 'gale':  return { draw: 1 };
    case 'stone': return { shield: 6 };
    default: return {};
  }
}

export function describeEffect(effect) {
  const parts = [];
  if (effect.damage) parts.push(`${effect.damage} dmg`);
  if (effect.shield) parts.push(`+${effect.shield} shield`);
  if (effect.heal) parts.push(`+${effect.heal} life`);
  if (effect.ember) parts.push(`+${effect.ember} ember`);
  if (effect.draw) parts.push(`draw ${effect.draw}`);
  return parts.join(' · ');
}
