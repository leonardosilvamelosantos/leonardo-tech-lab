const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const colors = { menta: '#b9f477', ciano: '#60c6cf', coral: '#f59b79' };
const character = { cor: 'menta', velocidade: 5, energia: 5, acessorio: 'nenhum' };
const heroCanvas = $('#hero-avatar');
const gameCanvas = $('#game-canvas');
const gameContext = gameCanvas.getContext('2d');
const heroContext = heroCanvas.getContext('2d');
const keys = new Set();
const touchKeys = new Set();
const game = { running: false, score: 0, lives: 5, time: 30, player: { x: 300, y: 220 }, stars: [], hazards: [], lastFrame: 0, lastSpawn: 0, lastSecond: 0, invincibleUntil: 0, frameId: 0 };

function rectangle(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function drawCharacter(ctx, centerX, centerY, scale, style = character) {
  const x = Math.round(centerX - 8 * scale);
  const y = Math.round(centerY - 10 * scale);
  const px = (col, row, w, h, color) => rectangle(ctx, x + col * scale, y + row * scale, w * scale, h * scale, color);
  const base = colors[style.cor] || colors.menta;
  px(5, 0, 6, 2, '#314b5d');
  px(3, 2, 10, 1, '#314b5d');
  px(2, 3, 12, 9, '#213a4c');
  px(3, 4, 10, 7, base);
  px(1, 6, 2, 5, base);
  px(13, 6, 2, 5, base);
  px(4, 11, 8, 5, '#e4eddf');
  px(3, 12, 2, 3, '#89aabc');
  px(11, 12, 2, 3, '#89aabc');
  px(5, 16, 2, 3, '#314b5d');
  px(9, 16, 2, 3, '#314b5d');
  px(4, 19, 3, 1, '#102535');
  px(9, 19, 3, 1, '#102535');
  px(5, 7, 2, 2, '#153042');
  px(9, 7, 2, 2, '#153042');
  px(7, 10, 2, 1, '#365265');
  if (style.acessorio === 'oculos') {
    px(4, 6, 8, 1, '#203649');
    px(4, 7, 3, 3, '#203649');
    px(9, 7, 3, 3, '#203649');
    px(5, 8, 1, 1, '#eaf8f4');
    px(10, 8, 1, 1, '#eaf8f4');
  }
  if (style.acessorio === 'antena') {
    px(7, -4, 2, 5, '#a2b9c4');
    px(6, -6, 4, 3, '#f5c474');
  }
}

function renderHero() {
  heroContext.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
  heroContext.imageSmoothingEnabled = false;
  rectangle(heroContext, 74, 259, 172, 8, '#07152255');
  rectangle(heroContext, 105, 252, 110, 7, '#0b1a2b66');
  drawCharacter(heroContext, 160, 145, 10);
  rectangle(heroContext, 75, 39, 17, 17, colors[character.cor]);
  rectangle(heroContext, 228, 85, 10, 10, '#f5c474');
  rectangle(heroContext, 252, 49, 7, 7, '#60c6cf');
  rectangle(heroContext, 49, 160, 8, 8, '#f59b79');
}

function updateCode() {
  const code = $('#code-preview');
  code.replaceChildren();
  const lines = [
    [['# Meu personagem', 'comment']],
    [['cor', 'plain'], [' = ', 'plain'], [`"${character.cor}"`, 'string']],
    [['velocidade', 'plain'], [' = ', 'plain'], [String(character.velocidade), 'number']],
    [['energia', 'plain'], [' = ', 'plain'], [String(character.energia), 'number']],
    [['acessorio', 'plain'], [' = ', 'plain'], [`"${character.acessorio}"`, 'string']],
    [['', 'plain']],
    [['# O jogo usa estes valores', 'comment']]
  ];
  lines.forEach((line, index) => {
    line.forEach(([value, type]) => {
      const span = document.createElement('span');
      span.textContent = value;
      if (type !== 'plain') span.className = `code-${type}`;
      code.append(span);
    });
    if (index < lines.length - 1) code.append(document.createTextNode('\n'));
  });
  $('#velocidade-value').textContent = character.velocidade;
  $('#energia-value').textContent = character.energia;
  if (!game.running) $('#lives').textContent = String(character.energia).padStart(2, '0');
  renderHero();
  if (!game.running) drawGame();
}

let validationTimer;
async function validateWithFlask() {
  clearTimeout(validationTimer);
  validationTimer = setTimeout(async () => {
    try {
      const response = await fetch('api/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character)
      });
      if (!response.ok) throw new Error('API indisponível');
      const result = await response.json();
      $('#engine-status').textContent = `${result.motor} · configuração validada`;
      $('#lab-feedback').textContent = result.dica;
    } catch {
      $('#engine-status').textContent = 'Modo estático · funciona no GitHub Pages';
      $('#lab-feedback').textContent = 'Variáveis atualizadas no navegador. Execute com Flask para testar a API em Python.';
    }
  }, 300);
}

function setCharacterVariable(name, value) {
  character[name] = ['velocidade', 'energia'].includes(name) ? Number(value) : value;
  updateCode();
  validateWithFlask();
}

function setupControls() {
  $$('input[name="cor"]').forEach((input) => input.addEventListener('change', () => setCharacterVariable('cor', input.value)));
  $('#velocidade').addEventListener('input', (event) => setCharacterVariable('velocidade', event.target.value));
  $('#energia').addEventListener('input', (event) => setCharacterVariable('energia', event.target.value));
  $('#acessorio').addEventListener('change', (event) => setCharacterVariable('acessorio', event.target.value));
  updateCode();
}

function placeCollectible(list, size = 14) {
  return { x: 24 + Math.random() * (gameCanvas.width - 48), y: 24 + Math.random() * (gameCanvas.height - 48), size };
}

function startGame() {
  cancelAnimationFrame(game.frameId);
  Object.assign(game, { running: true, score: 0, lives: character.energia, time: 30, player: { x: 300, y: 220 }, stars: [], hazards: [], lastFrame: 0, lastSpawn: 0, lastSecond: 0, invincibleUntil: 0 });
  game.stars.push(placeCollectible(game.stars));
  $('#game-overlay').hidden = true;
  updateStats();
  game.frameId = requestAnimationFrame(gameLoop);
}

function finishGame() {
  game.running = false;
  cancelAnimationFrame(game.frameId);
  $('#overlay-title').textContent = game.lives <= 0 ? 'Fim de jogo. Vamos tentar de novo?' : `${game.score} estrela${game.score === 1 ? '' : 's'} coletada${game.score === 1 ? '' : 's'}!`;
  $('#overlay-description').textContent = game.lives <= 0 ? 'Ajuste as variáveis e descubra uma nova estratégia.' : 'Mude os atributos e veja como o jogo responde.';
  $('#start-game').firstChild.textContent = 'Jogar novamente ';
  $('#game-overlay').hidden = false;
}

function updateStats() {
  $('#score').textContent = String(game.score).padStart(2, '0');
  $('#lives').textContent = String(game.lives).padStart(2, '0');
  $('#timer').textContent = `${Math.ceil(game.time)}s`;
}

function drawStar(ctx, x, y, size) {
  ctx.fillStyle = '#f5ce76';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? size : size * .46;
    const sx = x + Math.cos(angle) * radius;
    const sy = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
}

function drawGame() {
  const ctx = gameContext;
  const { width, height } = gameCanvas;
  ctx.clearRect(0, 0, width, height);
  rectangle(ctx, 0, 0, width, height, '#13283c');
  ctx.strokeStyle = '#ffffff0a';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 0; y <= height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  for (const star of game.stars) drawStar(ctx, star.x, star.y, star.size);
  for (const hazard of game.hazards) {
    rectangle(ctx, hazard.x - 12, hazard.y - 12, 24, 24, '#f59b79');
    rectangle(ctx, hazard.x - 5, hazard.y - 5, 10, 10, '#a4494e');
  }
  if (!(game.running && performance.now() < game.invincibleUntil && Math.floor(performance.now() / 120) % 2)) {
    drawCharacter(ctx, game.player.x, game.player.y, 2.45);
  }
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function gameLoop(timestamp) {
  if (!game.running) return;
  const delta = Math.min((timestamp - (game.lastFrame || timestamp)) / 1000, .05);
  game.lastFrame = timestamp;
  game.lastSecond += delta;
  game.lastSpawn += delta;
  while (game.lastSecond >= 1) { game.time -= 1; game.lastSecond -= 1; }
  if (game.lastSpawn >= 2.5 && game.hazards.length < 9) { game.hazards.push(placeCollectible(game.hazards)); game.lastSpawn = 0; }
  const held = (key) => keys.has(key) || touchKeys.has(key);
  const horizontal = Number(held('right') || held('d')) - Number(held('left') || held('a'));
  const vertical = Number(held('down') || held('s')) - Number(held('up') || held('w'));
  const magnitude = Math.hypot(horizontal, vertical) || 1;
  const movement = character.velocidade * 48 * delta;
  game.player.x = Math.max(23, Math.min(gameCanvas.width - 23, game.player.x + horizontal / magnitude * movement));
  game.player.y = Math.max(27, Math.min(gameCanvas.height - 28, game.player.y + vertical / magnitude * movement));
  for (let i = game.stars.length - 1; i >= 0; i--) {
    if (distance(game.player, game.stars[i]) < 29) { game.stars.splice(i, 1); game.score++; game.stars.push(placeCollectible(game.stars)); }
  }
  if (timestamp >= game.invincibleUntil) {
    for (const hazard of game.hazards) {
      if (distance(game.player, hazard) < 30) { game.lives--; game.invincibleUntil = timestamp + 1200; break; }
    }
  }
  drawGame();
  updateStats();
  if (game.lives <= 0 || game.time <= 0) { finishGame(); return; }
  game.frameId = requestAnimationFrame(gameLoop);
}

function setupGame() {
  $('#start-game').addEventListener('click', startGame);
  window.addEventListener('keydown', (event) => {
    const activeTag = document.activeElement?.tagName;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag)) return;
    const key = event.key.toLowerCase().replace('arrow', '');
    if (['up', 'down', 'left', 'right', 'w', 'a', 's', 'd'].includes(key) && game.running) { event.preventDefault(); keys.add(key); }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase().replace('arrow', '')));
  window.addEventListener('blur', () => { keys.clear(); touchKeys.clear(); });
  $$('[data-move]').forEach((button) => {
    const move = button.dataset.move;
    button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); touchKeys.add(move); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) => button.addEventListener(name, () => touchKeys.delete(move)));
  });
  drawGame();
}

function makeLink(url, text, className) {
  const link = document.createElement('a');
  link.className = className;
  link.textContent = text;
  link.href = url;
  if (/^https?:/i.test(url)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  return link;
}

function openProjectLightbox(project, preview) {
  const dialog = $('#project-lightbox');
  dialog.style.width = `min(94vw, ${Math.min(preview.width || 1500, 1500) + 40}px)`;
  $('#project-lightbox-title').textContent = project.title;
  $('#project-lightbox-image').src = preview.src;
  $('#project-lightbox-image').alt = preview.alt || `Imagem do projeto ${project.title}`;
  $('#project-lightbox-caption').textContent = preview.caption || project.title;
  dialog.showModal();
  document.body.classList.add('lightbox-open');
}

function setupLightbox() {
  const dialog = $('#project-lightbox');
  $('#project-lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => document.body.classList.remove('lightbox-open'));
}

function renderProfile(profile) {
  const name = profile.name || 'Seu nome';
  document.title = `${name} — desenvolvimento, educação e jogos`;
  $('.availability').lastChild.textContent = ` ${profile.location || 'Poços de Caldas, MG'}`;
  $('#profile-identity').textContent = `${name} · ${profile.headline || ''}`;
  $('#bio').textContent = profile.bio || '';
  const resume = $('#resume-list');
  resume.replaceChildren();
  (profile.resume || []).forEach((item) => { const row = document.createElement('div'); row.className = 'resume-item'; row.textContent = item; resume.append(row); });
  const projectList = $('#projects-list');
  projectList.replaceChildren();
  (profile.projects || []).forEach((project, index) => {
    const row = document.createElement('article'); row.className = 'project-row';
    const number = document.createElement('span'); number.className = 'project-index'; number.textContent = String(index + 1).padStart(2, '0');
    const details = document.createElement('div');
    const type = document.createElement('p'); type.className = 'project-type'; type.textContent = project.type || 'Projeto';
    const title = document.createElement('h3'); title.className = 'project-title'; title.textContent = project.title || 'Projeto';
    const description = document.createElement('p'); description.className = 'project-description'; description.textContent = project.description || '';
    const tags = document.createElement('div'); tags.className = 'project-tags';
    (project.tags || []).forEach((tag) => { const chip = document.createElement('span'); chip.textContent = tag; tags.append(chip); });
    details.append(type, title, description, tags);
    if (project.preview?.src) {
      const figure = document.createElement('figure');
      figure.className = `project-preview${project.preview.lightbox ? ' project-preview--image' : ''}`;
      const previewLink = document.createElement(project.preview.lightbox ? 'button' : 'a');
      if (project.preview.lightbox) {
        previewLink.type = 'button';
        previewLink.addEventListener('click', () => openProjectLightbox(project, project.preview));
        previewLink.setAttribute('aria-label', `Ampliar imagem de ${project.title}`);
      } else {
        previewLink.href = project.preview.src;
        previewLink.target = '_blank';
        previewLink.rel = 'noopener noreferrer';
        previewLink.setAttribute('aria-label', `Abrir demonstração de ${project.title} em outra aba`);
      }
      const previewImage = document.createElement('img');
      previewImage.src = project.preview.src;
      previewImage.alt = project.preview.alt || `Demonstração visual de ${project.title}`;
      previewImage.loading = 'lazy';
      previewImage.decoding = 'async';
      previewImage.width = project.preview.width || 500;
      previewImage.height = project.preview.height || 100;
      const caption = document.createElement('figcaption');
      caption.textContent = project.preview.caption || `Demonstração de ${project.title}`;
      previewLink.append(previewImage);
      figure.append(previewLink, caption);
      details.append(figure);
    }
    const links = document.createElement('div'); links.className = 'project-links';
    if (project.url) links.append(makeLink(project.url, 'Ver código ↗', 'project-link'));
    else { const status = document.createElement('span'); status.className = 'project-link'; status.textContent = project.linkLabel || 'Projeto sem link público'; status.setAttribute('aria-disabled', 'true'); links.append(status); }
    if (project.demoUrl) links.append(makeLink(project.demoUrl, 'Ver demonstração ↗', 'project-link'));
    if (project.preview?.lightbox) {
      const viewImage = document.createElement('button');
      viewImage.type = 'button';
      viewImage.className = 'project-link project-image-button';
      viewImage.textContent = 'Ver imagem ↗';
      viewImage.addEventListener('click', () => openProjectLightbox(project, project.preview));
      links.append(viewImage);
    }
    row.append(number, details, links); projectList.append(row);
  });
  $('#projects-note').hidden = (profile.projects || []).length > 1;
  if (profile.github) { const link = $('#github-link'); link.href = profile.github; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  if (profile.portfolio) { const link = $('#portfolio-link'); link.href = profile.portfolio; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.hidden = false; }
  if (profile.linkedin) { const link = $('#linkedin-link'); link.href = profile.linkedin; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  if (profile.email) $('#email-link').href = `mailto:${profile.email}`;
  else if (profile.linkedin) {
    const link = $('#email-link');
    link.href = profile.linkedin;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.firstChild.textContent = 'Conversar pelo LinkedIn ';
  } else { $('#email-link').href = '#sobre'; $('#email-link').firstChild.textContent = 'Conheça meu trabalho '; }

  const skills = (profile.skills || []).filter((skill) => Number(skill.weight) > 0);
  const total = skills.reduce((sum, skill) => sum + Number(skill.weight), 0);
  let progress = 0;
  const segments = skills.map((skill) => { const start = progress; progress += Number(skill.weight) / total * 100; return `${skill.color} ${start}% ${progress}%`; });
  $('#skills-donut').style.background = segments.length ? `conic-gradient(${segments.join(',')})` : '#dce5dc';
  $('#skills-donut').setAttribute('aria-label', `Distribuição ilustrativa: ${skills.map((skill) => `${skill.name} ${Math.round(Number(skill.weight) / total * 100)}%`).join(', ')}`);
  $('.donut-hole strong').textContent = String(skills.length).padStart(2, '0');
  const legend = $('#skills-legend'); legend.replaceChildren();
  skills.forEach((skill) => {
    const item = document.createElement('div'); item.className = 'legend-item';
    const swatch = document.createElement('span'); swatch.className = 'legend-swatch'; swatch.style.background = skill.color;
    const label = document.createElement('span'); label.textContent = skill.name;
    const value = document.createElement('strong'); value.textContent = `${Math.round(Number(skill.weight) / total * 100)}%`;
    item.append(swatch, label, value); legend.append(item);
  });
}

async function loadProfile() {
  try {
    const response = await fetch('profile.json');
    if (!response.ok) throw new Error('Perfil não encontrado');
    renderProfile(await response.json());
  } catch {
    $('#bio').textContent = 'O perfil não carregou. Execute o site por um servidor local para carregar profile.json.';
    $('#projects-note').textContent = 'Não foi possível carregar os projetos. Recarregue a página ou execute o site por um servidor local.';
  }
}

setupControls();
setupGame();
setupLightbox();
loadProfile();
validateWithFlask();
