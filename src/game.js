import {
  getState, setState, setFlag, hasFlag, getTrust, changeTrust,
  addKnowledge, addMessage, markTopicComplete, isTopicComplete,
} from './store.js';
import { getCharacterName, getCharacterPortrait, getNPCList } from './data.js';
import { trackEvent, setDialogueTime, flushSummary, buildSummary } from './analytics.js';

let timerInterval = null;
let containerEl = null;
const UI_TEXT = {
  en: {
    gameTitle: 'Diplomatic Dinner',
    characters: 'Characters',
    rooms: 'Rooms',
    mission: 'Mission',
    internalThoughts: 'Internal Thoughts',
    internalPlanning: 'Your private operational planning',
    selectChat: 'Select a character or room to begin.',
    navDialogues: 'Dialogues',
    navInfo: 'Info',
    navGoals: 'Goals',
    noTopics: 'No available topics right now.',
    chooseTopic: 'Choose a topic',
    back: 'Back',
    intelligence: 'Intelligence',
    knownFacts: 'Known Facts',
    rumors: 'Rumors',
    secrets: 'Secrets',
    noFacts: 'No confirmed facts yet.',
    noRumors: 'No rumors gathered yet.',
    goals: 'Goals',
    noGoals: 'No goals defined.',
    yourObjectives: 'Your Objectives',
    primary: 'Primary',
    secondary: 'Secondary',
    concerns: 'Concerns',
    topics: {
      small_talk: 'Small Talk',
      treaty: 'The Treaty',
      industry: 'Industry & Contracts',
      suspicion: 'Suspicion',
      private_alignment: 'Private Alliance',
      pressure: 'Apply Pressure',
      french_concessions: 'French Concessions',
      german_channel: 'German Back-Channel',
      hidden_terms: 'Hidden Terms',
      industrial_pipeline: 'Industrial Pipeline',
      balance_game: 'Balance of Power',
      provocation: 'Provocation',
      targeting: 'Select Target',
      subtle_manipulation: 'Build Influence',
      technical_annex: 'Technical Annex',
      german_alignment: 'German Alignment',
      side_deal: 'Side Deal',
      market_access: 'Market Access',
      host_control: 'Host\'s Concerns',
      financial_layer: 'Financial Interests',
      disruption_risk: 'Disruption Risk',
      stability: 'Stability',
      public_discussion: 'Public Discussion',
      treaty_debate: 'Treaty Debate',
      tension: 'Growing Tension',
      quiet_exchange: 'Quiet Exchange',
      private_offer: 'Private Offer',
      candid_talk: 'Candid Talk',
      rumor_exchange: 'Exchange Rumors',
    },
  },
  ru: {
    gameTitle: 'Дипломатический ужин',
    characters: 'Персонажи',
    rooms: 'Локации',
    mission: 'Миссия',
    internalThoughts: 'Внутренние мысли',
    internalPlanning: 'Ваше внутреннее оперативное планирование',
    selectChat: 'Выберите персонажа или комнату, чтобы начать.',
    navDialogues: 'Диалоги',
    navInfo: 'Инфо',
    navGoals: 'Цели',
    noTopics: 'Сейчас нет доступных тем.',
    chooseTopic: 'Выберите тему',
    back: 'Назад',
    intelligence: 'Разведданные',
    knownFacts: 'Известные факты',
    rumors: 'Слухи',
    secrets: 'Секреты',
    noFacts: 'Подтвержденных фактов пока нет.',
    noRumors: 'Слухов пока нет.',
    goals: 'Цели',
    noGoals: 'Цели не заданы.',
    yourObjectives: 'Ваши задачи',
    primary: 'Основная',
    secondary: 'Дополнительная',
    concerns: 'Риски',
    topics: {
      small_talk: 'Светская беседа',
      treaty: 'Соглашение',
      industry: 'Промышленность и контракты',
      suspicion: 'Подозрения',
      private_alignment: 'Частный союз',
      pressure: 'Оказать давление',
      french_concessions: 'Французские уступки',
      german_channel: 'Немецкий канал',
      hidden_terms: 'Скрытые условия',
      industrial_pipeline: 'Промышленная цепочка',
      balance_game: 'Баланс сил',
      provocation: 'Провокация',
      targeting: 'Выбрать цель',
      subtle_manipulation: 'Построить влияние',
      technical_annex: 'Технический аннекс',
      german_alignment: 'Немецкое выравнивание',
      side_deal: 'Сторонняя сделка',
      market_access: 'Доступ к рынку',
      host_control: 'Опасения хозяина',
      financial_layer: 'Финансовые интересы',
      disruption_risk: 'Риск срыва',
      stability: 'Стабильность',
      public_discussion: 'Публичное обсуждение',
      treaty_debate: 'Дебаты по соглашению',
      tension: 'Рост напряжения',
      quiet_exchange: 'Тихий обмен',
      private_offer: 'Личное предложение',
      candid_talk: 'Откровенный разговор',
      rumor_exchange: 'Обмен слухами',
    },
  },
};

function getUI(language) {
  return UI_TEXT[language] || UI_TEXT.en;
}

function getLocalizedText(value, language) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.en || Object.values(value)[0] || '';
}

export function initGame(app) {
  containerEl = app;
  const state = getState();
  state.elapsedSeconds = 0;
  state.victimId = null;
  trackEvent('game_started', { role: state.playerRole || '' });
  buildLayout();
  checkEvents(0);
  startTimer();
}

export function destroyGame() {
  if (timerInterval) clearInterval(timerInterval);
}

/* ===== LAYOUT ===== */

function buildLayout() {
  const state = getState();
  const language = state.language || 'en';
  const ui = getUI(language);
  const npcs = getNPCList(state.playerRole);
  const rooms = state.data.events.round_1.rooms;
  const roundDuration = state.data.events.round_1.duration_seconds || 60;
  const roundMins = Math.floor(roundDuration / 60);
  const roundSecs = roundDuration % 60;
  const roundLabel = `${String(roundMins).padStart(2, '0')}:${String(roundSecs).padStart(2, '0')}`;

  containerEl.innerHTML = `
    <div class="screen game-screen active">
      <div class="timer-bar">
        <span class="game-title">${ui.gameTitle}</span>
        <span class="timer-display" id="timer">00:00 / ${roundLabel}</span>
        <div class="timer-progress" id="timer-progress"></div>
      </div>
      <div class="game-layout">
        <div class="sidebar" id="sidebar">
          <div class="sidebar-section-label">${ui.characters}</div>
          ${npcs.map(c => `
            <button class="contact-item" data-chat="${c.id}">
              <img class="contact-avatar" src="${getCharacterPortrait(c.id)}" alt="${getCharacterName(c.id, language)}">
              <div class="contact-info">
                <div class="contact-name">${getCharacterName(c.id, language)}</div>
                <div class="contact-role">${getLocalizedText(c.role, language)} — ${getLocalizedText(c.country, language)}</div>
              </div>
              <div class="unread-dot"></div>
            </button>
          `).join('')}
          <div class="sidebar-section-label">${ui.rooms}</div>
          ${rooms.map(r => `
            <button class="room-item" data-chat="${r.id}">
              <div class="room-icon">${r.id === 'main_hall' ? '🏛' : r.id === 'balcony' ? '🌙' : '🚬'}</div>
              <div class="contact-info">
                <div class="room-name">${getLocalizedText(r.name, language)}</div>
              </div>
            </button>
          `).join('')}
          ${state.playerRole === 'arthur_bennett' ? `
            <div class="sidebar-section-label">${ui.mission}</div>
            <button class="room-item" data-chat="mission">
              <div class="room-icon">🗡</div>
              <div class="contact-info">
                <div class="room-name">${ui.internalThoughts}</div>
              </div>
            </button>
          ` : ''}
        </div>
        <div class="chat-area" id="chat-area">
          <div class="chat-header" id="chat-header">
            <div class="chat-header-name" style="color:var(--text-muted);font-style:italic;">${ui.selectChat}</div>
          </div>
          <div class="chat-messages" id="chat-messages"></div>
          <div class="choices-panel" id="choices-panel"></div>
          <div class="info-panel" id="info-panel"></div>
          <div class="goals-panel" id="goals-panel"></div>
        </div>
      </div>
      <div class="bottom-nav">
        <button class="nav-btn active" data-nav="chat" id="nav-chat">${ui.navDialogues}</button>
        <button class="nav-btn" data-nav="info" id="nav-info">${ui.navInfo}</button>
        <button class="nav-btn" data-nav="goals" id="nav-goals">${ui.navGoals}</button>
      </div>
      <div class="event-toast" id="event-toast">
        <div class="event-title"></div>
        <div class="event-text"></div>
      </div>
    </div>
  `;

  containerEl.querySelectorAll('.contact-item').forEach(item => {
    item.classList.add('has-unread');
    item.addEventListener('click', () => openChat(item.dataset.chat));
  });
  containerEl.querySelectorAll('.room-item').forEach(item => {
    item.addEventListener('click', () => openChat(item.dataset.chat));
  });

  document.getElementById('nav-chat').addEventListener('click', () => switchPanel('chat'));
  document.getElementById('nav-info').addEventListener('click', () => switchPanel('info'));
  document.getElementById('nav-goals').addEventListener('click', () => switchPanel('goals'));

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('hidden');
  }
}

function switchPanel(panel) {
  containerEl.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  containerEl.querySelector(`[data-nav="${panel}"]`).classList.add('active');

  document.getElementById('info-panel').classList.remove('open');
  document.getElementById('goals-panel').classList.remove('open');

  if (panel === 'info') {
    renderInfoPanel();
    document.getElementById('info-panel').classList.add('open');
  } else if (panel === 'goals') {
    renderGoalsPanel();
    document.getElementById('goals-panel').classList.add('open');
  }
}

/* ===== TIMER & EVENTS ===== */

function startTimer() {
  const state = getState();
  const roundDuration = state.data.events.round_1.duration_seconds || 60;
  const roundMins = Math.floor(roundDuration / 60);
  const roundSecs = roundDuration % 60;
  const roundLabel = `${String(roundMins).padStart(2, '0')}:${String(roundSecs).padStart(2, '0')}`;

  timerInterval = setInterval(() => {
    const state = getState();
    state.elapsedSeconds++;

    const mins = Math.floor(state.elapsedSeconds / 60);
    const secs = state.elapsedSeconds % 60;
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} / ${roundLabel}`;
    }
    const progressEl = document.getElementById('timer-progress');
    if (progressEl) {
      progressEl.style.width = `${(state.elapsedSeconds / roundDuration) * 100}%`;
    }

    checkEvents(state.elapsedSeconds);

    if (state.elapsedSeconds >= roundDuration) {
      clearInterval(timerInterval);
      resolveDeath();
    }
  }, 1000);
}

function checkEvents(time) {
  const state = getState();
  const events = state.data.events.round_1.events;

  events.forEach(event => {
    if (event.time === time && !state.triggeredEvents.has(event.id)) {
      state.triggeredEvents.add(event.id);
      triggerEvent(event);
    }
  });
}

function triggerEvent(event) {
  const language = getState().language || 'en';
  if (event.id === 'round_start' || event.id === 'death_event') return;

  event.effects?.forEach(effect => {
    setFlag(effect);
  });

  showEventToast(event);

  if (event.hints?.length) {
    event.hints.forEach(hint => {
      addKnowledge('rumor', getLocalizedText(hint, language));
    });
  }

  const currentChat = getState().currentChat;
  if (currentChat) {
    addMessage(currentChat, 'system', getLocalizedText(event.text, language));
    renderMessages(currentChat);
  }

  containerEl?.querySelectorAll('.contact-item').forEach(item => {
    if (item.dataset.chat !== currentChat) {
      item.classList.add('has-unread');
    }
  });
}

const EVENT_TITLES = {
  en: {
    telegram_arrival: 'Telegram',
    first_drinks: 'First Drinks',
    final_drinks: 'Final Drinks',
    death_event: 'End of Evening',
  },
  ru: {
    telegram_arrival: 'Телеграмма',
    first_drinks: 'Первые напитки',
    final_drinks: 'Последние напитки',
    death_event: 'Конец вечера',
  },
};

function showEventToast(event) {
  const language = getState().language || 'en';
  const toast = document.getElementById('event-toast');
  if (!toast) return;
  const titles = EVENT_TITLES[language] || EVENT_TITLES.en;
  toast.querySelector('.event-title').textContent = titles[event.id] || event.id.replace(/_/g, ' ').toUpperCase();
  toast.querySelector('.event-text').textContent = getLocalizedText(event.text, language);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 5000);
}

/* ===== CHAT ===== */

function openChat(chatId) {
  const state = getState();
  const language = state.language || 'en';
  const ui = getUI(language);
  trackEvent('chat_opened', { chatId });
  setState({ currentChat: chatId, activeDialogueNode: null, activeTopic: null });

  if (isNPC(chatId)) {
    state.isolatedWith = chatId;
    setFlag('target_isolated_' + chatId);
  } else {
    state.isolatedWith = null;
  }

  containerEl.querySelectorAll('.contact-item, .room-item').forEach(el => {
    el.classList.toggle('active', el.dataset.chat === chatId);
    if (el.dataset.chat === chatId) el.classList.remove('has-unread');
  });

  const header = document.getElementById('chat-header');
  if (isNPC(chatId)) {
    header.innerHTML = `
      <button class="mobile-back" id="mobile-back">← ${ui.back}</button>
      <img src="${getCharacterPortrait(chatId)}" alt="">
      <div>
        <div class="chat-header-name">${getCharacterName(chatId, language)}</div>
        <div class="chat-header-detail">${getLocalizedText(state.data.characters[chatId]?.role, language)} — ${getLocalizedText(state.data.characters[chatId]?.country, language)}</div>
      </div>
    `;
  } else if (chatId === 'mission') {
    header.innerHTML = `
      <button class="mobile-back" id="mobile-back">← ${ui.back}</button>
      <div>
        <div class="chat-header-name">${ui.internalThoughts}</div>
        <div class="chat-header-detail">${ui.internalPlanning}</div>
      </div>
    `;
  } else {
    const room = state.data.events.round_1.rooms.find(r => r.id === chatId);
    header.innerHTML = `
      <button class="mobile-back" id="mobile-back">← ${ui.back}</button>
      <div>
        <div class="chat-header-name">${getLocalizedText(room?.name, language) || chatId}</div>
        <div class="chat-header-detail">${getLocalizedText(room?.description, language) || ''}</div>
      </div>
    `;
  }

  const backBtn = document.getElementById('mobile-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('hidden');
      containerEl.querySelectorAll('.contact-item, .room-item').forEach(el => {
        el.classList.remove('active');
      });
    });
  }

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.add('hidden');
  }

  renderMessages(chatId);
  showTopicSelection(chatId);
}

function isNPC(id) {
  return !!getState().data.characters[id];
}

function renderMessages(chatId) {
  const state = getState();
  const language = state.language || 'en';
  const messages = state.chatHistories[chatId] || [];
  const msgContainer = document.getElementById('chat-messages');
  if (!msgContainer) return;

  msgContainer.innerHTML = messages.map(m => {
    if (m.speaker === 'system') {
      return `<div class="msg system">${getLocalizedText(m.text, language)}</div>`;
    }
    const isPlayer = m.speaker === state.playerRole;
    return `
      <div class="msg ${isPlayer ? 'player' : 'npc'}">
        ${!isPlayer ? `<div class="msg-sender">${getCharacterName(m.speaker, language)}</div>` : ''}
        ${getLocalizedText(m.text, language)}
        <div class="msg-time">${m.timestamp}</div>
      </div>
    `;
  }).join('');

  msgContainer.scrollTop = msgContainer.scrollHeight;
}

/* ===== TOPIC SELECTION ===== */

function showTopicSelection(chatId) {
  const state = getState();
  const language = state.language || 'en';
  const ui = getUI(language);
  const choicesPanel = document.getElementById('choices-panel');
  if (!choicesPanel) return;

  const availableTopics = getAvailableTopics(chatId);

  if (availableTopics.length === 0) {
    choicesPanel.innerHTML = `<div class="topic-select-label">${ui.noTopics}</div>`;
    return;
  }
  const topicLabels = ui.topics;

  const displayTopics = availableTopics.length > 4
    ? availableTopics.slice(0, 4)
    : availableTopics;

  choicesPanel.innerHTML = `
    <div class="topic-select-label">${ui.chooseTopic}</div>
    ${displayTopics.map(t => `
      <button class="choice-btn" data-topic="${t}">${topicLabels[t] || t}</button>
    `).join('')}
  `;

  choicesPanel.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent('topic_selected', { chatId, topicId: btn.dataset.topic });
      startDialogue(chatId, btn.dataset.topic);
    });
  });
}

function getAvailableTopics(chatId) {
  const state = getState();
  const dialogueMap = state.data.dialogueMap;
  const dialogues = state.data.dialogues;

  let topics;
  let charMap;
  let charDialogues;

  if (chatId === 'mission') {
    charMap = dialogueMap.characters[state.playerRole];
    charDialogues = dialogues[state.playerRole];
    if (!charMap || !charDialogues) return [];
    topics = ['targeting'].filter(t => charMap.topics.includes(t));
  } else if (isNPC(chatId)) {
    charMap = dialogueMap.characters[chatId];
    charDialogues = dialogues[chatId];
    if (!charMap || !charDialogues) return [];
    topics = charMap.topics;
  } else {
    charMap = dialogueMap.group_chats[chatId];
    charDialogues = dialogues.rooms?.[chatId];
    if (!charMap || !charDialogues) return [];
    topics = charMap.topics;
  }

  return topics.filter(topic => {
    if (isTopicComplete(chatId, topic)) return false;
    if (!charDialogues[topic]) return false;

    const dialogue = charDialogues[topic];
    if (dialogue.requires_trust !== undefined && chatId !== 'mission') {
      if (getTrust(chatId) < dialogue.requires_trust) return false;
    }
    if (dialogue.requires_event) {
      if (!state.triggeredEvents.has(dialogue.requires_event)) return false;
    }
    if (dialogue.requires_role) {
      if (state.playerRole !== dialogue.requires_role) return false;
    }

    if ((isNPC(chatId) || chatId === 'mission') && charMap.unlock_conditions?.[topic]) {
      const conditions = charMap.unlock_conditions[topic];
      for (const cond of conditions) {
        if (cond.startsWith('trust>=')) {
          if (getTrust(chatId) < parseInt(cond.split('>=')[1])) return false;
        } else if (cond.startsWith('trust<=')) {
          if (getTrust(chatId) > parseInt(cond.split('<=')[1])) return false;
        } else if (cond.startsWith('player_knows:')) {
          const key = cond.split(':')[1].replace(/_/g, ' ');
          const lang = state.language || 'en';
          const allKnowledge = [...state.knownFacts, ...state.knownRumors, ...state.knownSecrets];
          const found = allKnowledge.some(k => {
            const text = getLocalizedText(k, lang);
            return text.toLowerCase().includes(key);
          });
          if (!found) return false;
        } else if (cond.startsWith('event:')) {
          if (!state.triggeredEvents.has(cond.split(':')[1])) return false;
        } else if (cond.startsWith('player_role:')) {
          if (state.playerRole !== cond.split(':')[1]) return false;
        }
      }
    }

    return true;
  });
}

/* ===== DIALOGUE ENGINE ===== */

function startDialogue(chatId, topicId) {
  const state = getState();
  const dialogues = state.data.dialogues;

  let topicDialogue;
  if (chatId === 'mission') {
    topicDialogue = dialogues[state.playerRole]?.[topicId];
  } else if (isNPC(chatId)) {
    topicDialogue = dialogues[chatId]?.[topicId];
  } else {
    topicDialogue = dialogues.rooms?.[chatId]?.[topicId];
  }

  if (!topicDialogue) return;

  setState({ activeTopic: topicId });
  const entryNode = topicDialogue.nodes[topicDialogue.entry];
  showDialogueNode(chatId, topicId, topicDialogue.entry, entryNode, topicDialogue);
}

function showDialogueNode(chatId, topicId, nodeId, node, topicData) {
  const state = getState();
  const language = state.language || 'en';

  if (node.speaker !== 'system') {
    addMessage(chatId, node.speaker, getLocalizedText(node.text, language));
  } else {
    addMessage(chatId, 'system', getLocalizedText(node.text, language));
  }
  renderMessages(chatId);

  if (node.effects) {
    applyEffects(chatId, node.effects);
  }

  if (!node.choices || node.choices.length === 0) {
    markTopicComplete(chatId, topicId);
    setTimeout(() => showTopicSelection(chatId), 500);
    return;
  }

  const choicesPanel = document.getElementById('choices-panel');
  choicesPanel.innerHTML = node.choices.map((c, i) => `
    <button class="choice-btn" data-choice="${i}">${getLocalizedText(c.text, language)}</button>
  `).join('');

  choicesPanel.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const choice = node.choices[parseInt(btn.dataset.choice)];
      trackEvent('dialogue_choice_clicked', {
        chatId,
        topicId,
        nodeId,
        choiceText: getLocalizedText(choice.text, language),
      });

      addMessage(chatId, state.playerRole, getLocalizedText(choice.text, language));
      renderMessages(chatId);

      if (choice.effects) {
        applyEffects(chatId, choice.effects);
      }

      if (choice.next && topicData.nodes[choice.next]) {
        setTimeout(() => {
          showDialogueNode(chatId, topicId, choice.next, topicData.nodes[choice.next], topicData);
        }, 600);
      } else {
        markTopicComplete(chatId, topicId);
        setTimeout(() => showTopicSelection(chatId), 500);
      }
    });
  });
}

function applyEffects(chatId, effects) {
  const language = getState().language || 'en';
  if (effects.trust !== undefined && isNPC(chatId)) {
    changeTrust(chatId, effects.trust);
  }

  if (effects.flags) {
    effects.flags.forEach(f => setFlag(f));
  }

  if (effects.knowledge) {
    addKnowledge(effects.knowledge.type, getLocalizedText(effects.knowledge.text, language));
  }

  if (effects.unlock_topic) {
    // Future: dynamically unlock topics
  }
}

/* ===== INFO PANEL ===== */

function renderInfoPanel() {
  const state = getState();
  const language = state.language || 'en';
  const ui = getUI(language);
  const panel = document.getElementById('info-panel');

  panel.innerHTML = `
    <h3>${ui.intelligence}</h3>
    <div class="info-section">
      <h4>${ui.knownFacts}</h4>
      ${state.knownFacts.length > 0
        ? state.knownFacts.map(f => `<div class="info-item">${getLocalizedText(f, language)}</div>`).join('')
        : `<div class="info-item" style="color:var(--text-muted)">${ui.noFacts}</div>`
      }
    </div>
    <div class="info-section">
      <h4>${ui.rumors}</h4>
      ${state.knownRumors.length > 0
        ? state.knownRumors.map(r => `<div class="info-item">${getLocalizedText(r, language)}</div>`).join('')
        : `<div class="info-item" style="color:var(--text-muted)">${ui.noRumors}</div>`
      }
    </div>
    ${state.knownSecrets.length > 0 ? `
      <div class="info-section">
        <h4>${ui.secrets}</h4>
        ${state.knownSecrets.map(s => `<div class="info-item">${getLocalizedText(s, language)}</div>`).join('')}
      </div>
    ` : ''}
  `;
}

/* ===== GOALS PANEL ===== */

function renderGoalsPanel() {
  const state = getState();
  const language = state.language || 'en';
  const ui = getUI(language);
  const roleGoals = state.data.goals.roles[state.playerRole];
  const panel = document.getElementById('goals-panel');

  if (!roleGoals) {
    panel.innerHTML = `<h3>${ui.goals}</h3><p style="color:var(--text-muted)">${ui.noGoals}</p>`;
    return;
  }

  panel.innerHTML = `
    <h3>${ui.yourObjectives}</h3>
    <div class="goal-item">
      <h4>${ui.primary}</h4>
      <p>${getLocalizedText(roleGoals.main_goal.description, language)}</p>
    </div>
    ${roleGoals.hidden_goals.map(g => `
      <div class="goal-item">
        <h4>${ui.secondary}</h4>
        <p>${getLocalizedText(g.description, language)}</p>
      </div>
    `).join('')}
    <div class="info-section" style="margin-top:24px">
      <h4>${ui.concerns}</h4>
      ${roleGoals.fears.map(f => `
        <div class="info-item" style="color:var(--danger)">${getLocalizedText(f.description, language)}</div>
      `).join('')}
    </div>
  `;
}

/* ===== DEATH RESOLUTION ===== */

function resolveDeath() {
  const state = getState();
  const deathLogic = state.data.goals.death_logic;

  setFlag('death_occurred');

  if (state.playerRole === 'arthur_bennett') {
    resolveAsBennett(deathLogic);
  } else {
    resolveAsNonBennett();
  }

  setDialogueTime(state.elapsedSeconds);
  trackEvent('reached_end', {
    elapsedSeconds: state.elapsedSeconds,
    victimId: state.victimId || '',
    playerRole: state.playerRole || '',
  });
  flushSummary(buildSummary({
    language: state.language || 'en',
    role: state.playerRole || '',
    victim: state.victimId || '',
  }));

  destroyGame();
  setState({ screen: 'death' });
}

function pickVictimCandidate(state) {
  const explicit = [...state.flags].find(f => f.startsWith('victim_'));
  if (explicit) return explicit.replace('victim_', '');

  if (state.isolatedWith && state.data.characters[state.isolatedWith]) {
    return state.isolatedWith;
  }

  const isolatedFlag = [...state.flags].find(
    f => f.startsWith('target_isolated_') && f !== `target_isolated_${state.playerRole}`
  );
  if (isolatedFlag) return isolatedFlag.replace('target_isolated_', '');

  if (hasFlag('target_beaumont')) return 'henri_beaumont';
  if (hasFlag('target_keller')) return 'friedrich_keller';

  const fallback = Object.keys(state.data.characters).find(id => id !== state.playerRole);
  return fallback || null;
}

function resolveAsBennett(deathLogic) {
  const state = getState();

  const hasTarget = hasFlag('target_selected') || hasFlag('target_flexible');

  let targetId = null;
  if (hasFlag('target_beaumont')) targetId = 'henri_beaumont';
  else if (hasFlag('target_keller')) targetId = 'friedrich_keller';

  const hasIsolation = targetId
    ? state.flags.has('target_isolated_' + targetId)
    : Object.keys(state.trust).some(id => state.flags.has('target_isolated_' + id));

  const hasTrustHigh = targetId
    ? (getTrust(targetId) >= 1)
    : hasFlag('target_trust_high');

  if (hasFlag('enable_poison_execution') && hasTarget && hasIsolation && hasTrustHigh) {
    setFlag('poison_administered');
    setFlag('correct_target');
    const victim = targetId || pickVictimCandidate(state);
    if (victim) {
      setFlag('victim_' + victim);
      state.victimId = victim;
    }
  } else if (hasFlag('enable_poison_execution') && hasTarget) {
    setFlag('poison_administered');
    setFlag('wrong_target_poisoned');
    state.victimId = pickVictimCandidate(state);
  } else {
    setFlag('no_death');
    state.victimId = null;
  }
}

function resolveAsNonBennett() {
  const state = getState();
  setFlag('poison_administered');

  const trust = state.trust;
  const bennettTrust = trust.arthur_bennett ?? 0;

  if (bennettTrust >= 1) {
    setFlag('correct_target');
  } else {
    setFlag('wrong_target_poisoned');
  }
  state.victimId = pickVictimCandidate(state);
}
