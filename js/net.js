/*
 * Транспорт сетевого режима: адаптер над PeerJS (WebRTC DataChannel).
 *
 * INTERFACE:
 *   Net.makeCode(len, rng) → код комнаты 'HYP-XXXXXX' — он же PeerJS-ID хоста.
 *   Net.normalize(raw)     → код из пользовательского ввода (верхний регистр, без пробелов).
 *   Net.isValid(code)      → код соответствует формату комнаты.
 *   await Net.host({ code, onReady, onLink, onData, onLinkClosed, onError }) → { send, close }
 *   await Net.join({ code, onLink, onData, onLinkClosed, onError })          → { send, close }
 *     onReady        — комната слушает брокер (только host);
 *     onLink         — канал данных открыт;
 *     onData(msg)    — входящее сообщение (объект, сериализация PeerJS);
 *     onLinkClosed   — соперник закрыл канал;
 *     onError(kind)  — kind: 'unreachable' | 'busy' | 'unsupported' | 'net'.
 *   peerjs берётся npm-зависимостью ленивым динамическим импортом в момент
 *   подключения: пока игра локальная, чанк пакета не загружается, а Node-тесты
 *   (makeCode/normalize/isValid) не тянут браузерный модуль. Ошибка загрузки —
 *   не падение, а onError('unsupported') и мёртвый транспорт-заглушка.
 */
const Net = (() => {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без I, O, 0, 1 — не путаются при вводе

  let peerPromise = null;
  function loadPeer() {
    if (!peerPromise) {
      peerPromise = import('peerjs')
        .then((m) => m.default)
        .catch((e) => {
          peerPromise = null; // следующая попытка загрузит заново
          throw e;
        });
    }
    return peerPromise;
  }

  function makeCode(len = 6, rng = Math.random) {
    let s = '';
    for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(rng() * ALPHABET.length)];
    return 'HYP-' + s;
  }

  function normalize(raw) {
    return String(raw == null ? '' : raw)
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
  }

  function isValid(code) {
    return /^HYP-[A-HJ-NP-Z2-9]{6}$/.test(code);
  }

  function errorKind(err) {
    switch (err && err.type) {
      case 'peer-unavailable':
        return 'unreachable';
      case 'unavailable-id':
        return 'busy';
      case 'browser-incompatible':
        return 'unsupported';
      default:
        return 'net';
    }
  }

  function wireConn(conn, h) {
    conn.on('open', () => {
      if (h.onLink) h.onLink();
    });
    conn.on('data', (msg) => {
      if (h.onData) h.onData(msg);
    });
    conn.on('close', () => {
      if (h.onLinkClosed) h.onLinkClosed();
    });
    conn.on('error', () => {
      if (h.onError) h.onError('net');
    });
  }

  function handlePeerError(err, h, dead) {
    if (!dead && h.onError) h.onError(errorKind(err));
  }

  async function host({ code, onReady, onLink, onData, onLinkClosed, onError }) {
    let Peer;
    try {
      Peer = await loadPeer();
    } catch {
      if (onError) onError('unsupported');
      return { send() {}, close() {} };
    }
    const peer = new Peer(code, { debug: 1 });
    let conn = null;
    let dead = false;
    peer.on('open', () => {
      if (onReady) onReady();
    });
    peer.on('connection', (c) => {
      if (conn) {
        try {
          c.close();
        } catch {
          /* второй гость не нужен */
        }
        return;
      }
      conn = c;
      wireConn(c, {
        onLink,
        onData,
        onError,
        onLinkClosed: () => {
          conn = null;
          if (!dead && onLinkClosed) onLinkClosed();
        },
      });
    });
    peer.on('error', (err) => handlePeerError(err, { onError }, dead));
    return {
      send(msg) {
        if (conn) {
          try {
            conn.send(msg);
          } catch {
            /* канал уже мёртв */
          }
        }
      },
      close() {
        dead = true;
        try {
          if (conn) conn.close();
        } catch {
          /* уже закрыт */
        }
        try {
          peer.destroy();
        } catch {
          /* уже разрушен */
        }
      },
    };
  }

  async function join({ code, onLink, onData, onLinkClosed, onError }) {
    let Peer;
    try {
      Peer = await loadPeer();
    } catch {
      if (onError) onError('unsupported');
      return { send() {}, close() {} };
    }
    const peer = new Peer({ debug: 1 });
    let conn = null;
    let dead = false;
    peer.on('open', () => {
      conn = peer.connect(code, { reliable: true });
      wireConn(conn, {
        onLink,
        onData,
        onError,
        onLinkClosed: () => {
          if (!dead && onLinkClosed) onLinkClosed();
        },
      });
    });
    peer.on('error', (err) => handlePeerError(err, { onError }, dead));
    return {
      send(msg) {
        if (conn) {
          try {
            conn.send(msg);
          } catch {
            /* канал уже мёртв */
          }
        }
      },
      close() {
        dead = true;
        try {
          if (conn) conn.close();
        } catch {
          /* уже закрыт */
        }
        try {
          peer.destroy();
        } catch {
          /* уже разрушен */
        }
      },
    };
  }

  return { makeCode, normalize, isValid, host, join };
})();

export default Net;
