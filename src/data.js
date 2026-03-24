import { getState } from './store.js';

const FILES = {
  characters: 'characters.json',
  relationships: 'relationships.json',
  knowledge: 'knowledge.json',
  goals: 'goals.json',
  events: 'events.json',
  dialogueMap: 'dialogue_map.json',
  dialogues: 'dialogues.json',
  introText: 'intro_text.json',
  epilogueText: 'epilogue_text.json',
};

const CHARACTER_NAMES = {
  henri_beaumont: { en: 'Henri Beaumont', ru: 'Анри Бомон' },
  friedrich_keller: { en: 'Friedrich Keller', ru: 'Фридрих Келлер' },
  edward_whitmore: { en: 'Edward Whitmore', ru: 'Эдвард Уитмор' },
  arthur_bennett: { en: 'Arthur Bennett', ru: 'Артур Беннетт' },
  klaus_reinhardt: { en: 'Klaus Reinhardt', ru: 'Клаус Рейнхардт' },
  luca_moretti: { en: 'Luca Moretti', ru: 'Лука Моретти' },
  count_von_ruden: { en: 'Count Elias von Rüden', ru: 'Граф Элиас фон Руден' },
};

export async function loadAllData() {
  const state = getState();
  const entries = Object.entries(FILES);
  const cacheBuster = Date.now();
  const results = await Promise.all(
    entries.map(([, path]) =>
      fetch(`${path}?v=${cacheBuster}`, { cache: 'no-store' }).then(r => r.json())
    )
  );
  entries.forEach(([key], i) => {
    state.data[key] = results[i];
  });
  return state.data;
}

export function getCharacterName(id, language) {
  const state = getState();
  const lang = language || state.language || 'en';
  const localized = CHARACTER_NAMES[id]?.[lang];
  if (localized) return localized;
  return state.data.characters?.[id]?.name ?? id;
}

export function getCharacterPortrait(id) {
  const map = {
    henri_beaumont: 'assets/Beaumont.png',
    friedrich_keller: 'assets/Keller.png',
    edward_whitmore: 'assets/Whitmore.png',
    arthur_bennett: 'assets/Bennett.png',
    klaus_reinhardt: 'assets/Reinhardt.png',
    luca_moretti: 'assets/Moretti.png',
    count_von_ruden: 'assets/VonRuden.png',
  };
  return map[id] ?? '';
}

export function getPlayableCharacters() {
  const chars = getState().data.characters;
  return Object.entries(chars)
    .filter(([, c]) => c.playable)
    .map(([id, c]) => ({ id, ...c }));
}

export function getNPCList(playerRole) {
  const chars = getState().data.characters;
  return Object.entries(chars)
    .filter(([id]) => id !== playerRole)
    .map(([id, c]) => ({ id, ...c }));
}
