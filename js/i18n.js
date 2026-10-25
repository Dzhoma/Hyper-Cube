/*
 * Словарь интерфейса и язык — единый механизм i18n (ADR-0005): один словарь,
 * одна точка смены языка, один путь подстановки параметров.
 *
 * INTERFACE:
 *   t(key, params) → строка на текущем языке; {placeholder} замещается params;
 *                    неизвестный ключ возвращается как есть — пропавший перевод видно сразу.
 *   currentLang()  → текущий язык ('en' | 'ru'); 'en' по умолчанию.
 *   setLang(l)     → сменить язык и запомнить выбор (localStorage 'xo4d.lang');
 *                    перерендер DOM — забота app.js.
 */
const I18N = {
  en: {
    'title.tag': 'Hyper-Cube // tic-tac-toe in four-dimensional space',
    'menu.subtitle': '// HYPERFIELD ACTIVE · TIC-TAC-TOE IN FOUR-DIMENSIONAL SPACE',
    'menu.field.lang': 'LANGUAGE:',
    'menu.field.opponent': 'OPPONENT:',
    'menu.field.side': 'YOUR SYMBOL:',
    'menu.field.level': 'AI LEVEL:',
    'opp.human': 'HUMAN',
    'opp.human.sub': 'hot-seat · 2 players',
    'opp.ai': 'AI',
    'opp.ai.sub': 'play against the machine',
    'menu.field.net': 'CONNECTION:',
    'opp.online': 'ONLINE',
    'opp.online.sub': 'p2p · direct webrtc link',
    'net.role.host': 'HOST',
    'net.role.host.sub': 'create a room, share the code',
    'net.role.join': 'JOIN',
    'net.role.join.sub': 'enter the room code',
    'net.code.hint': 'ROOM CODE · HYP-XXXXXX',
    'btn.start.net.host': '▶ OPEN ROOM',
    'btn.start.net.join': '▶ CONNECT',
    'btn.copy.code': '⧉ COPY CODE',
    'btn.copy.link': '⧉ COPY LINK',
    'net.status.opening': 'OPENING ROOM…',
    'net.status.hosting': 'ROOM {code} · WAITING FOR OPPONENT',
    'net.status.connecting': 'LINKING TO {code}…',
    'net.status.peer': 'OPPONENT CONNECTED',
    'net.status.copied': 'COPIED',
    'net.status.badcode': 'MALFORMED ROOM CODE',
    'net.status.unreachable': 'ROOM NOT FOUND',
    'net.status.busy': 'ROOM CODE BUSY · TRY AGAIN',
    'net.status.version': 'PROTOCOL MISMATCH · REFRESH THE PAGE',
    'net.status.unsupported': 'WEBRTC UNAVAILABLE IN THIS BROWSER',
    'net.status.error': 'LINK ERROR',
    'net.status.closed': 'CONNECTION LOST',
    'net.status.left': 'OPPONENT LEFT THE ROOM',
    'side.X.sub': 'move first',
    'side.O.sub': 'move second',
    'level.0': 'SCRIPT KIDDIE',
    'level.0.sub': 'noise and randomness',
    'level.1': 'NETRUNNER',
    'level.1.sub': 'greedy heuristic',
    'level.2': 'CORPORATE AI',
    'level.2.sub': 'search · up to ~1 sec',
    'btn.start': '▶ INITIALIZE MATCH',
    'btn.rules': 'RULES // PROTOCOL',
    'hint.hypercube': 'HYPERCUBE: {dims} · {cells} cells · {lines} winning lines',
    'tag.mode.hypercube': '// HYPERCUBE · {dims} · {n} IN A ROW',
    'tag.opponent.human': '// HOT-SEAT · 2 PLAYERS',
    'tag.opponent.ai': '// AI: {level}',
    'tag.opponent.p2p': '// ONLINE · P2P LINK',
    'tag.round': 'ROUND {n}',
    'score.draws': 'DRAWS',
    'btn.sound.on': 'SOUND: ON',
    'btn.sound.off': 'SOUND: OFF',
    'btn.restart': '⟲ RESTART',
    'btn.menu': 'MENU',
    'turn.thinking': 'AI THINKING',
    'turn.hotseat': '▶ TURN: {sym}',
    'turn.you': '▶ YOUR TURN: {sym}',
    'turn.wait': '// WAITING: {sym}',
    'turn.line': '// LINE CLOSED: {sym} WINS',
    'turn.draw': '// GAME OVER: DRAW',
    'hint.board': 'SLICES w×x // INSIDE SLICE: ROWS y · COLUMNS z',
    'btn.next': '▶ NEXT ROUND',
    'btn.hide': '▼ COLLAPSE // ANALYZE',
    'overlay.title.x': '{sym} WINS',
    'overlay.title.ai': 'AI WINS',
    'overlay.title.hack': 'HACK CONFIRMED',
    'overlay.title.draw': 'DRAW',
    'overlay.sub.draw': '// SYSTEM BALANCED',
    'overlay.sub.hack': '// HUMAN ({sym}) OUTPLAYS THE AI · LEVEL: {level}',
    'overlay.sub.ai': '// SYMBOL {sym} · LEVEL: {level}',
    'overlay.sub.line': '// LINE CLOSED IN FOUR DIMENSIONS',
    'overlay.net.sub': '// LINK TERMINATED · MATCH ABORTED',
    'rules.title': '// PROTOCOL: HYPERFIELD RULES',
    'btn.rules.close': '✕ CLOSE',
    'aria.cell': 'Slice {wx}, cell {yz}',
    'rules.1.t': '1 · HYPERFIELD',
    'rules.1.p':
      'The game is played in a four-dimensional cube n×n×n×n. Every cell is addressed by four coordinates (w, x, y, z). For humans, the hyperfield is displayed as a grid of slices: the grid rows are the w coordinate, the columns are x; inside a slice, rows are y and columns are z.',
    'rules.2.t': '2 · TURNS',
    'rules.2.p':
      'Players take turns occupying free cells: X is a cyan cross, O is a magenta circle. X moves first in the first round; the starting player alternates every following round.',
    'rules.3.t': '3 · WIN AND DRAW',
    'rules.3.p':
      'To win, assemble a line of {n} of your symbols along any straight line of four-dimensional space:',
    'rules.3.li1': 'along an axis — within a single dimension;',
    'rules.3.li2': 'a slice diagonal — in the plane of two dimensions;',
    'rules.3.li3': 'a cube diagonal — through the volume of three dimensions;',
    'rules.3.li4': 'a hypercube diagonal — through all four dimensions.',
    'rules.3.p2':
      'There are {lines} such lines. A draw is when all playable cells are occupied and there is no line. The winning line is highlighted on the board — the victory window can be collapsed and the combination analyzed.',
    'rules.4.t': '4 · THE FIELD',
    'rules.4.p':
      '<b>HYPERCUBE</b> — {dims}, {cells} cells, {n} in a row to win. An unrestricted field with deep, honest competition.',
    'rules.5.t': '5 · OPPONENTS',
    'rules.5.li1': '<b>HOT-SEAT</b> — two humans take turns on one device.',
    'rules.5.li2':
      '<b>SCRIPT KIDDIE AI</b> — noise and randomness, occasionally notices the obvious.',
    'rules.5.li3': '<b>NETRUNNER AI</b> — a greedy heuristic: wins, blocks, pulls the best lines.',
    'rules.5.li4':
      '<b>CORPORATE AI</b> — alpha-beta search evaluating every line; thinks for up to ~1 second.',
    'rules.5.li5':
      '<b>ONLINE</b> — direct p2p link between two devices (WebRTC). The host opens a room, plays X and shares the code or invite link; the guest joins as O.',
    'rules.6.t': '6 · MATCH',
    'rules.6.p':
      'X wins, O wins and draws are accumulated across rounds. Changing the opponent starts a new match and resets the score.',
  },
  ru: {
    'title.tag': 'Hyper-Cube // крестики-нолики четырёхмерного пространства',
    'menu.subtitle': '// ГИПЕРПОЛЕ АКТИВНО · КРЕСТИКИ-НОЛИКИ ЧЕТЫРЁХМЕРНОГО ПРОСТРАНСТВА',
    'menu.field.lang': 'ЯЗЫК:',
    'menu.field.opponent': 'СОПЕРНИК:',
    'menu.field.side': 'ВАШ СИМВОЛ:',
    'menu.field.level': 'УРОВЕНЬ ИИ:',
    'opp.human': 'ЧЕЛОВЕК',
    'opp.human.sub': 'хот-сит · 2 игрока',
    'opp.ai': 'ИИ',
    'opp.ai.sub': 'игра против машины',
    'menu.field.net': 'СВЯЗЬ:',
    'opp.online': 'ОНЛАЙН',
    'opp.online.sub': 'p2p · прямое соединение',
    'net.role.host': 'ХОСТ',
    'net.role.host.sub': 'создать комнату и передать код',
    'net.role.join': 'ГОСТЬ',
    'net.role.join.sub': 'ввести код комнаты',
    'net.code.hint': 'КОД КОМНАТЫ · HYP-XXXXXX',
    'btn.start.net.host': '▶ ОТКРЫТЬ КОМНАТУ',
    'btn.start.net.join': '▶ ПОДКЛЮЧИТЬСЯ',
    'btn.copy.code': '⧉ КОД',
    'btn.copy.link': '⧉ ССЫЛКА',
    'net.status.opening': 'ОТКРЫВАЮ КОМНАТУ…',
    'net.status.hosting': 'КОМНАТА {code} · ЖДУ СОПЕРНИКА',
    'net.status.connecting': 'СОЕДИНЕНИЕ С {code}…',
    'net.status.peer': 'СОПЕРНИК ПОДКЛЮЧИЛСЯ',
    'net.status.copied': 'СКОПИРОВАНО',
    'net.status.badcode': 'НЕВЕРНЫЙ КОД КОМНАТЫ',
    'net.status.unreachable': 'КОМНАТА НЕ НАЙДЕНА',
    'net.status.busy': 'КОД ЗАНЯТ · ПОПРОБУЙТЕ ЕЩЁ РАЗ',
    'net.status.version': 'РАЗНЫЕ ВЕРСИИ ПРОТОКОЛА · ОБНОВИТЕ СТРАНИЦУ',
    'net.status.unsupported': 'WEBRTC НЕДОСТУПЕН В ЭТОМ БРАУЗЕРЕ',
    'net.status.error': 'ОШИБКА СВЯЗИ',
    'net.status.closed': 'СВЯЗЬ ПОТЕРЯНА',
    'net.status.left': 'СОПЕРНИК ПОКИНУЛ КОМНАТУ',
    'side.X.sub': 'ход первым',
    'side.O.sub': 'ход вторым',
    'level.0': 'СКРИП-КИДДИ',
    'level.0.sub': 'случайность и шум',
    'level.1': 'НЕТРАННЕР',
    'level.1.sub': 'жадная эвристика',
    'level.2': 'КОРПОРАТИВНЫЙ ИИ',
    'level.2.sub': 'перебор · до ~1 сек',
    'btn.start': '▶ ИНИЦИАЛИЗИРОВАТЬ МАТЧ',
    'btn.rules': 'ПРАВИЛА // ПРОТОКОЛ',
    'hint.hypercube': 'ГИПЕРКУБ: {dims} · {cells} клеток · {lines} линий победы',
    'tag.mode.hypercube': '// ГИПЕРКУБ · {dims} · {n} В РЯД',
    'tag.opponent.human': '// ХОТ-СИТ · 2 ИГРОКА',
    'tag.opponent.ai': '// ИИ: {level}',
    'tag.opponent.p2p': '// ОНЛАЙН · P2P-КАНАЛ',
    'tag.round': 'РАУНД {n}',
    'score.draws': 'НИЧЬИ',
    'btn.sound.on': 'ЗВУК: ВКЛ',
    'btn.sound.off': 'ЗВУК: ВЫКЛ',
    'btn.restart': '⟲ РЕСТАРТ',
    'btn.menu': 'МЕНЮ',
    'turn.thinking': 'ИИ ДУМАЕТ',
    'turn.hotseat': '▶ ХОД: {sym}',
    'turn.you': '▶ ВАШ ХОД: {sym}',
    'turn.wait': '// ЖДЁМ ХОД: {sym}',
    'turn.line': '// ЛИНИЯ ЗАМКНУТА: {sym} ПОБЕЖДАЕТ',
    'turn.draw': '// ПАРТИЯ ЗАВЕРШЕНА: НИЧЬЯ',
    'hint.board': 'СРЕЗЫ w×x // ВНУТРИ СРЕЗА: СТРОКИ y · СТОЛБЦЫ z',
    'btn.next': '▶ СЛЕДУЮЩИЙ РАУНД',
    'btn.hide': '▼ СВЕРНУТЬ // АНАЛИЗ',
    'overlay.title.x': '{sym} ПОБЕЖДАЕТ',
    'overlay.title.ai': 'ИИ ПОБЕЖДАЕТ',
    'overlay.title.hack': 'ВЗЛОМ ПОДТВЕРЖДЁН',
    'overlay.title.draw': 'НИЧЬЯ',
    'overlay.sub.draw': '// СИСТЕМА СБАЛАНСИРОВАНА',
    'overlay.sub.hack': '// ЧЕЛОВЕК ({sym}) ОБХОДИТ ИИ · УРОВЕНЬ: {level}',
    'overlay.sub.ai': '// СИМВОЛ {sym} · УРОВЕНЬ: {level}',
    'overlay.sub.line': '// ЛИНИЯ ЗАМКНУТА В ЧЕТЫРЁХ ИЗМЕРЕНИЯХ',
    'overlay.net.sub': '// КАНАЛ ЗАКРЫТ · МАТЧ ПРЕРВАН',
    'rules.title': '// ПРОТОКОЛ: ПРАВИЛА ГИПЕРПОЛЯ',
    'btn.rules.close': '✕ ЗАКРЫТЬ',
    'aria.cell': 'Срез {wx}, клетка {yz}',
    'rules.1.t': '1 · ГИПЕРПОЛЕ',
    'rules.1.p':
      'Партия идёт в четырёхмерном кубе n×n×n×n. Каждая клетка адресуется четырьмя координатами (w, x, y, z). Для человека гиперполе отображается сеткой срезов: строки сетки — координата w, столбцы — x; внутри среза строки — y, столбцы — z.',
    'rules.2.t': '2 · ХОДЫ',
    'rules.2.p':
      'Соперники по очереди занимают свободные клетки: X — циановый крест, O — маджентовый круг. В первом раунде первым ходит X, в каждом следующем раунде стартёр чередуется.',
    'rules.3.t': '3 · ПОБЕДА И НИЧЬЯ',
    'rules.3.p':
      'Победа — собрать линию из {n} своих символов по любой прямой четырёхмерного пространства:',
    'rules.3.li1': 'по оси — вдоль одного измерения;',
    'rules.3.li2': 'диагональ среза — в плоскости двух измерений;',
    'rules.3.li3': 'диагональ куба — через объём трёх измерений;',
    'rules.3.li4': 'диагональ гиперкуба — через все четыре измерения.',
    'rules.3.p2':
      'Таких линий {lines}. Ничья: все игровые клетки заняты, а линии нет. Выигрышная линия подсвечивается на поле — окно победы можно свернуть и разобрать комбинацию.',
    'rules.4.t': '4 · ПОЛЕ',
    'rules.4.p':
      '<b>ГИПЕРКУБ</b> — {dims}, {cells} клеток, победа — {n} в ряд. Поле без ограничений, глубокая честная борьба.',
    'rules.5.t': '5 · СОПЕРНИКИ',
    'rules.5.li1': '<b>ХОТ-СИТ</b> — два человека по очереди за одним устройством.',
    'rules.5.li2': '<b>ИИ «СКРИП-КИДДИ»</b> — шум и случайность, изредка замечает очевидное.',
    'rules.5.li3':
      '<b>ИИ «НЕТРАННЕР»</b> — жадная эвристика: выигрывает, блокирует, тянет лучшие линии.',
    'rules.5.li4':
      '<b>ИИ «КОРПОРАТИВНЫЙ»</b> — перебор альфа-бета с оценкой всех линий; думает до ~1 секунды.',
    'rules.5.li5':
      '<b>ОНЛАЙН</b> — прямое p2p-соединение двух устройств (WebRTC). Хост открывает комнату, играет X и передаёт код или ссылку-приглашение; гость подключается символом O.',
    'rules.6.t': '6 · МАТЧ',
    'rules.6.p':
      'Победы X, победы O и ничьи суммируются между раундами. Смена соперника запускает новый матч и сбрасывает счёт.',
  },
};

let lang = 'en';
try {
  if (localStorage.getItem('xo4d.lang') === 'ru') lang = 'ru';
} catch {
  /* приватный режим */
}

export function t(key, params) {
  let s = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
  return s;
}

export function currentLang() {
  return lang;
}

export function setLang(l) {
  lang = l;
  try {
    localStorage.setItem('xo4d.lang', l);
  } catch {
    /* игнорируем */
  }
}
