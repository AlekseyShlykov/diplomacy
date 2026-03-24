import { getState, setState, subscribe, addKnowledge } from './store.js';
import { loadAllData, getPlayableCharacters, getCharacterPortrait, getCharacterName } from './data.js';
import { initGame, destroyGame } from './game.js';
import { trackEvent, flushSummary, submitEmail, buildSummary } from './analytics.js';

const app = document.getElementById('app');
let bgMusic = null;
let musicEnabled = true;
let musicToggleBtn = null;
const UI_TEXT = {
  en: {
    languagePrompt: 'Choose language',
    chooseRoleTitle: 'Choose Your Role',
    chooseRoleSubtitle: 'Each role offers a unique perspective on the evening\'s events.',
    rumorsLabel: 'Rumors',
    beginEvening: 'Begin the Evening',
    skip: 'Skip',
    continue: 'Continue',
    thanks: 'Thank you. The story will continue.',
    musicOn: 'Music: On',
    musicOff: 'Music: Off',
    victimLine: 'Poisoned and deceased: ',
    noVictimLine: 'No one was poisoned and killed.',
    roleDescriptions: {
      henri_beaumont: 'French Ambassador. Navigate diplomacy, build alliances, and secure the treaty on favorable terms.',
      arthur_bennett: 'British Industrialist - or so it appears. Your real mission is far more dangerous.',
      klaus_reinhardt: 'German Industrialist. Leverage the treaty for commercial advantage. Knowledge is power.',
    },
    death: {
      default: 'A guest suddenly collapses. The room falls silent.',
      noDeath: 'The evening draws to a close. Glasses are emptied, farewells exchanged. But as the last guests linger, a scream echoes from down the corridor. Someone has been found... lifeless.',
      correct: 'A sharp gasp. A glass shatters on marble. One of the guests crumples to the floor. The room freezes. The evening will never be the same.',
      wrong: 'A commotion at the far end of the hall. Someone has fallen. But the faces around you suggest this was not the outcome anyone expected. The wrong person lies motionless on the floor.',
    },
  },
  ru: {
    languagePrompt: 'Выберите язык',
    chooseRoleTitle: 'Выберите роль',
    chooseRoleSubtitle: 'Каждая роль дает уникальный взгляд на события вечера.',
    rumorsLabel: 'Слухи',
    beginEvening: 'Начать вечер',
    skip: 'Пропустить',
    continue: 'Продолжить',
    thanks: 'Спасибо. История продолжится.',
    musicOn: 'Музыка: Вкл',
    musicOff: 'Музыка: Выкл',
    victimLine: 'Отравлен и погиб: ',
    noVictimLine: 'Никто не был отравлен и не погиб.',
    roleDescriptions: {
      henri_beaumont: 'Французский посол. Ведите дипломатию, стройте союзы и добейтесь выгодного для Франции соглашения.',
      arthur_bennett: 'Британский промышленник — по крайней мере, так кажется. Ваша настоящая миссия куда опаснее.',
      klaus_reinhardt: 'Немецкий промышленник. Превратите соглашение в коммерческое преимущество. Информация — сила.',
    },
    death: {
      default: 'Один из гостей внезапно падает. В комнате воцаряется тишина.',
      noDeath: 'Вечер подходит к концу. Бокалы пустеют, звучат прощания. Но в последние минуты из коридора доносится крик. Кого-то нашли... без признаков жизни.',
      correct: 'Резкий вздох. Бокал разбивается о мрамор. Один из гостей падает на пол. Комната замирает. Этот вечер уже никогда не будет прежним.',
      wrong: 'На другом конце зала вспыхивает суматоха. Кто-то упал. Но по лицам вокруг видно: это совсем не тот исход, которого ждали. На полу лежит не тот человек.',
    },
  },
};

function setupMusic() {
  if (!bgMusic) {
    bgMusic = new Audio('assets/music.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.35;
    bgMusic.preload = 'auto';
  }

  if (!musicToggleBtn) {
    musicToggleBtn = document.createElement('button');
    musicToggleBtn.className = 'music-toggle-btn';
    musicToggleBtn.type = 'button';
    musicToggleBtn.addEventListener('click', () => {
      musicEnabled = !musicEnabled;
      if (musicEnabled) {
        bgMusic.play().catch(() => {});
      } else {
        bgMusic.pause();
      }
      updateMusicToggleLabel();
    });
    document.body.appendChild(musicToggleBtn);
  }

  const unlockAudio = () => {
    if (musicEnabled) bgMusic.play().catch(() => {});
  };
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
  updateMusicToggleLabel();
}

async function boot() {
  await loadAllData();
  const state = getState();
  // Always start from language selection on fresh app load.
  state.screen = 'languageSelect';
  if (!state.language) state.language = 'en';
  setupMusic();
  app.dataset.screen = '';
  subscribe(render);
  render(state);
}

function render(state) {
  updateMusicToggleLabel();
  const current = app.dataset.screen;
  if (current === state.screen) return;
  app.dataset.screen = state.screen;

  switch (state.screen) {
    case 'languageSelect': showLanguageSelect(); break;
    case 'intro': showIntro(); break;
    case 'roleSelect': showRoleSelect(); break;
    case 'briefing': showBriefing(); break;
    case 'game': showGame(); break;
    case 'death': showDeath(); break;
    case 'epilogue': showEpilogue(); break;
  }
}

function getLocalizedText(value, language) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.en || Object.values(value)[0] || '';
}

function getUI(language) {
  return UI_TEXT[language] || UI_TEXT.en;
}

function updateMusicToggleLabel() {
  if (!musicToggleBtn) return;
  const language = getState().language || 'en';
  const ui = getUI(language);
  musicToggleBtn.textContent = musicEnabled ? ui.musicOn : ui.musicOff;
}

/* ===== LANGUAGE SELECT ===== */

function showLanguageSelect() {
  const language = getState().language || 'en';
  const ui = getUI(language);
  app.innerHTML = `
    <div class="screen language-screen active">
      <img class="language-bg" src="assets/1.png" alt="">
      <div class="language-overlay">
        <h1>Diplomatic Dinner</h1>
        <p>${ui.languagePrompt}</p>
        <div class="language-options">
          <button class="language-btn" data-lang="en">English</button>
          <button class="language-btn" data-lang="ru">Русский</button>
        </div>
      </div>
    </div>
  `;

  app.querySelectorAll('.language-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent('language_selected', { language: btn.dataset.lang });
      setState({ language: btn.dataset.lang, screen: 'intro' });
    });
  });
}

/* ===== INTRO ===== */

function showIntro() {
  const state = getState();
  const data = state.data.introText;
  const language = state.language || 'en';
  const ui = getUI(language);
  const slides = data.slides;
  const images = ['assets/1.png', 'assets/2.png', 'assets/3.png', 'assets/4.png'];

  app.innerHTML = `
    <div class="screen intro-screen active">
      ${slides.map((s, i) => `
        <div class="intro-slide ${i === 0 ? 'active' : ''}" data-idx="${i}">
          <img src="${images[i] || images[0]}" alt="">
          <div class="intro-text-box">
            <div class="intro-text" id="intro-text-${i}"></div>
          </div>
        </div>
      `).join('')}
      <button class="intro-skip" id="intro-skip">${ui.skip}</button>
    </div>
  `;

  let currentSlide = 0;
  let typewriterTimeout = null;
  let slideTimeout = null;

  function typewrite(el, text, speed = 35) {
    return new Promise(resolve => {
      let idx = 0;
      el.textContent = '';
      el.classList.add('typewriter-cursor');
      function tick() {
        if (idx < text.length) {
          el.textContent += text[idx];
          idx++;
          typewriterTimeout = setTimeout(tick, speed);
        } else {
          el.classList.remove('typewriter-cursor');
          resolve();
        }
      }
      tick();
    });
  }

  async function playSlide(idx) {
    const allSlides = app.querySelectorAll('.intro-slide');
    allSlides.forEach(s => s.classList.remove('active'));
    const slide = allSlides[idx];
    if (!slide) { finishIntro(); return; }
    slide.classList.add('active');

    const textEl = slide.querySelector('.intro-text');
    await typewrite(textEl, getLocalizedText(slides[idx].text, language));
    slideTimeout = setTimeout(() => {
      currentSlide++;
      if (currentSlide < slides.length) {
        playSlide(currentSlide);
      } else {
        finishIntro();
      }
    }, slides[idx].duration);
  }

  function finishIntro() {
    clearTimeout(typewriterTimeout);
    clearTimeout(slideTimeout);
    setState({ screen: 'roleSelect' });
  }

  document.getElementById('intro-skip').addEventListener('click', finishIntro);
  playSlide(0);
}

/* ===== ROLE SELECT ===== */

function showRoleSelect() {
  const language = getState().language || 'en';
  const ui = getUI(language);
  const playable = getPlayableCharacters();
  const roleDescriptions = ui.roleDescriptions;

  app.innerHTML = `
    <div class="screen role-screen active">
      <h1>${ui.chooseRoleTitle}</h1>
      <p class="subtitle">${ui.chooseRoleSubtitle}</p>
      <div class="role-cards">
        ${playable.map(c => `
          <div class="role-card" role="button" tabindex="0" data-role="${c.id}">
            <img src="${getCharacterPortrait(c.id)}" alt="${getCharacterName(c.id, language)}">
            <h2>${getCharacterName(c.id, language)}</h2>
            <div class="role-label">${getLocalizedText(c.role, language)} — ${getLocalizedText(c.country, language)}</div>
            <div class="role-desc">${roleDescriptions[c.id] || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  app.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
      const roleId = card.dataset.role;
      selectRole(roleId);
    });
  });
}

function selectRole(roleId) {
  const state = getState();
  const knowledge = state.data.knowledge;
  const relationships = state.data.relationships;

  const trust = {};
  const charRelations = relationships.characters[roleId];
  if (charRelations) {
    Object.entries(charRelations.trust).forEach(([id, val]) => {
      trust[id] = val;
    });
  }

  const startingKnowledge = knowledge.playable_roles_starting_knowledge[roleId];
  const knownFacts = [...(startingKnowledge?.starting_facts || [])];
  const knownRumors = [...(startingKnowledge?.starting_rumors || [])];
  trackEvent('role_selected', { role: roleId });

  setState({
    playerRole: roleId,
    trust,
    knownFacts,
    knownRumors,
    knownSecrets: [],
    screen: 'briefing',
  });
}

/* ===== BRIEFING ===== */

function showBriefing() {
  const state = getState();
  const language = state.language || 'en';
  const ui = getUI(language);
  const roleId = state.playerRole;
  const knowledgeData = state.data.knowledge.knowledge_by_character[roleId];

  app.innerHTML = `
    <div class="screen active" style="background:var(--bg-dark)">
      <div class="briefing-overlay active">
        <div class="briefing-content">
          <h2>${getCharacterName(roleId, language)}</h2>
          <p>${getLocalizedText(knowledgeData.starting_briefing, language)}</p>
          <div class="briefing-facts">
            <ul>
              ${state.knownFacts.map(f => `<li>${getLocalizedText(f, language)}</li>`).join('')}
            </ul>
          </div>
          ${state.knownRumors.length > 0 ? `
            <p style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;text-transform:uppercase;letter-spacing:0.1em;">${ui.rumorsLabel}</p>
            <div class="briefing-facts">
              <ul>
                ${state.knownRumors.map(r => `<li>${getLocalizedText(r, language)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <button class="briefing-btn" id="start-game">${ui.beginEvening}</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('start-game').addEventListener('click', () => {
    setState({ screen: 'game' });
  });
}

/* ===== GAME ===== */

function showGame() {
  initGame(app);
}

/* ===== DEATH ===== */

function showDeath() {
  const state = getState();
  const language = state.language || 'en';
  const ui = getUI(language);
  const flags = state.flags;

  let deathNarrative = ui.death.default;

  if (flags.has('no_death')) {
    deathNarrative = ui.death.noDeath;
  } else if (flags.has('correct_target')) {
    deathNarrative = ui.death.correct;
  } else if (flags.has('wrong_target_poisoned')) {
    deathNarrative = ui.death.wrong;
  }

  app.innerHTML = `
    <div class="screen active" style="background:var(--bg-dark)">
      <div class="death-overlay active">
        <div class="death-text">${deathNarrative}</div>
        <button class="death-continue" id="death-continue">${ui.continue}</button>
      </div>
    </div>
  `;

  document.getElementById('death-continue').addEventListener('click', () => {
    trackEvent('death_continue_clicked', {});
    setState({ screen: 'epilogue' });
  });
}

/* ===== EPILOGUE ===== */

function showEpilogue() {
  const state = getState();
  const data = state.data.epilogueText;
  const language = state.language || 'en';
  const ui = getUI(language);
  const slides = data.slides;
  const images = ['assets/11.png', 'assets/12.png'];
  const victimName = state.victimId ? getCharacterName(state.victimId, language) : '';
  const victimLine = state.flags.has('no_death')
    ? ui.noVictimLine
    : `${ui.victimLine}${victimName || '-'}`;

  app.innerHTML = `
    <div class="screen epilogue-screen active">
      ${slides.map((s, i) => `
        <div class="epilogue-slide ${i === 0 ? 'active' : ''}" data-idx="${i}">
          <img src="${images[i] || images[0]}" alt="">
          <div class="epilogue-text-box">
            <div class="epilogue-text" id="epi-text-${i}"></div>
          </div>
        </div>
      `).join('')}
      <div class="cta-container" id="cta">
        <h2>${getLocalizedText(data.cta.title, language)}</h2>
        <p class="cta-desc">${getLocalizedText(data.cta.description, language)}</p>
        <p class="cta-desc">${victimLine}</p>
        <div class="cta-form" id="cta-form">
          <input type="email" placeholder="${getLocalizedText(data.cta.placeholder, language)}" id="cta-email">
          <button id="cta-submit">${getLocalizedText(data.cta.button, language)}</button>
        </div>
        <p class="cta-note">${getLocalizedText(data.cta.note, language)}</p>
        <p class="cta-thanks" id="cta-thanks">${getUI(language).thanks}</p>
      </div>
    </div>
  `;

  let currentSlide = 0;

  function typewrite(el, text, speed = 40) {
    return new Promise(resolve => {
      let idx = 0;
      el.textContent = '';
      el.classList.add('typewriter-cursor');
      function tick() {
        if (idx < text.length) {
          el.textContent += text[idx];
          idx++;
          setTimeout(tick, speed);
        } else {
          el.classList.remove('typewriter-cursor');
          resolve();
        }
      }
      tick();
    });
  }

  async function playSlide(idx) {
    const allSlides = app.querySelectorAll('.epilogue-slide');
    allSlides.forEach(s => s.classList.remove('active'));
    const slide = allSlides[idx];
    if (!slide) { showCTA(); return; }
    slide.classList.add('active');

    const textEl = slide.querySelector('.epilogue-text');
    await typewrite(textEl, getLocalizedText(slides[idx].text, language));
    setTimeout(() => {
      currentSlide++;
      if (currentSlide < slides.length) {
        playSlide(currentSlide);
      } else {
        setTimeout(showCTA, 2000);
      }
    }, slides[idx].duration);
  }

  function showCTA() {
    app.querySelectorAll('.epilogue-slide').forEach(s => s.classList.remove('active'));
    document.getElementById('cta').classList.add('active');
  }

  document.getElementById('cta-submit').addEventListener('click', () => {
    const email = document.getElementById('cta-email').value;
    if (email && email.includes('@')) {
      const summary = buildSummary({
        language,
        role: state.playerRole || '',
        victim: victimName || '',
      });
      trackEvent('email_submitted', { email_domain: email.split('@')[1] || '' });
      submitEmail(email, summary);
      flushSummary(summary);
      document.getElementById('cta-form').style.display = 'none';
      document.querySelector('.cta-note').style.display = 'none';
      document.getElementById('cta-thanks').style.display = 'block';
    }
  });

  playSlide(0);
}

boot();
