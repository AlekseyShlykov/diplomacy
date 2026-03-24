const state = {
  screen: 'languageSelect',
  language: 'en',
  playerRole: null,
  elapsedSeconds: 0,
  timerInterval: null,
  trust: {},
  flags: new Set(),
  knownFacts: [],
  knownRumors: [],
  knownSecrets: [],
  triggeredEvents: new Set(),
  currentChat: null,
  chatHistories: {},
  activeDialogueNode: null,
  activeTopic: null,
  completedTopics: {},
  isolatedWith: null,
  victimId: null,
  data: {
    characters: null,
    relationships: null,
    knowledge: null,
    goals: null,
    events: null,
    dialogueMap: null,
    dialogues: null,
    introText: null,
    epilogueText: null,
  }
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(updates) {
  Object.assign(state, updates);
  notify();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach(fn => fn(state));
}

export function setFlag(flag) {
  state.flags.add(flag);
  notify();
}

export function hasFlag(flag) {
  if (flag.startsWith('not_')) {
    return !state.flags.has(flag.slice(4));
  }
  return state.flags.has(flag);
}

export function getTrust(characterId) {
  return state.trust[characterId] ?? 0;
}

export function changeTrust(characterId, delta) {
  const current = getTrust(characterId);
  state.trust[characterId] = Math.max(-2, Math.min(2, current + delta));
  notify();
}

export function addKnowledge(type, text) {
  const list = type === 'fact' ? state.knownFacts
    : type === 'rumor' ? state.knownRumors
    : state.knownSecrets;

  const textStr = typeof text === 'string' ? text
    : (text?.en || Object.values(text || {})[0] || '');
  const isDuplicate = list.some(existing => {
    const existingStr = typeof existing === 'string' ? existing
      : (existing?.en || Object.values(existing || {})[0] || '');
    return existingStr === textStr;
  });

  if (!isDuplicate) {
    list.push(text);
    notify();
  }
}

export function addMessage(targetId, speaker, text) {
  if (!state.chatHistories[targetId]) {
    state.chatHistories[targetId] = [];
  }
  const minutes = Math.floor(state.elapsedSeconds / 60);
  const seconds = state.elapsedSeconds % 60;
  const timestamp = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  state.chatHistories[targetId].push({ speaker, text, timestamp });
  notify();
}

export function markTopicComplete(characterId, topicId) {
  if (!state.completedTopics[characterId]) {
    state.completedTopics[characterId] = new Set();
  }
  state.completedTopics[characterId].add(topicId);
}

export function isTopicComplete(characterId, topicId) {
  return state.completedTopics[characterId]?.has(topicId) ?? false;
}
