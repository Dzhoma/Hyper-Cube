'use strict';

/*
 * Транспорт сетевого режима: тонкий адаптер над PeerJS (WebRTC DataChannel).
 *
 * INTERFACE:
 *   Net.makeCode(len, rng) → код комнаты 'HYP-XXXXXX' — он же PeerJS-ID хоста.
 *   Net.normalize(raw)     → код из пользовательского ввода (верхний регистр, без пробелов).
 *   Net.isValid(code)      → код соответствует формату комнаты.
 *   Net.host({ code, onReady, onLink, onData, onLinkClosed, onError, Peer }) → { send, close }
 *   Net.join({ code, onLink, onData, onLinkClosed, onError, Peer })          → { send, close }
 *     onReady        — комната слушает брокер (только host);
 *     onLink         — канал данных открыт;
 *     onData(msg)    — входящее сообщение (объект, сериализация PeerJS);
 *     onLinkClosed   — соперник закрыл канал;
 *     onError(kind)  — kind: 'unreachable' | 'busy' | 'unsupported' | 'net'.
 *   Конструктор Peer инъецируется (в браузере — window.Peer с CDN): протокол
 *   тестируется на Session с фейковыми транспортами, адаптер остаётся тонким.
 */
const Net = (() => {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без I, O, 0, 1 — не путаются при вводе

  function makeCode(len = 6, rng = Math.random) {
    let s = '';
    for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(rng() * ALPHABET.length)];
    return 'HYP-' + s;
  }

  function normalize(raw) {
    return String(raw == null ? '' : raw).trim().toUpperCase().replace(/\s+/g, '');
  }

  function isValid(code) {
    return /^HYP-[A-HJ-NP-Z2-9]{6}$/.test(code);
  }

  function errorKind(err) {
    switch (err && err.type) {
      case 'peer-unavailable': return 'unreachable';
      case 'unavailable-id': return 'busy';
      case 'browser-incompatible': return 'unsupported';
      default: return 'net';
    }
  }

  function peerCtor() {
    return (typeof window !== 'undefined' && window.Peer) || null;
  }

  function wireConn(conn, h) {
    conn.on('open', () => { if (h.onLink) h.onLink(); });
    conn.on('data', (msg) => { if (h.onData) h.onData(msg); });
    conn.on('close', () => { if (h.onLinkClosed) h.onLinkClosed(); });
    conn.on('error', () => { if (h.onError) h.onError('net'); });
  }

  function handlePeerError(err, h, dead) {
    if (!dead && h.onError) h.onError(errorKind(err));
  }

  function host({ code, onReady, onLink, onData, onLinkClosed, onError, Peer = peerCtor() }) {
    if (!Peer) { if (onError) onError('unsupported'); return { send() {}, close() {} }; }
    const peer = new Peer(code, { debug: 1 });
    let conn = null;
    let dead = false;
    peer.on('open', () => { if (onReady) onReady(); });
    peer.on('connection', (c) => {
      if (conn) { try { c.close(); } catch (e) { /* второй гость не нужен */ } return; }
      conn = c;
      wireConn(c, {
        onLink, onData, onError,
        onLinkClosed: () => { conn = null; if (!dead && onLinkClosed) onLinkClosed(); },
      });
    });
    peer.on('error', (err) => handlePeerError(err, { onError }, dead));
    return {
      send(msg) { if (conn) { try { conn.send(msg); } catch (e) { /* канал уже мёртв */ } } },
      close() {
        dead = true;
        try { if (conn) conn.close(); } catch (e) { /* уже закрыт */ }
        try { peer.destroy(); } catch (e) { /* уже разрушен */ }
      },
    };
  }

  function join({ code, onLink, onData, onLinkClosed, onError, Peer = peerCtor() }) {
    if (!Peer) { if (onError) onError('unsupported'); return { send() {}, close() {} }; }
    const peer = new Peer({ debug: 1 });
    let conn = null;
    let dead = false;
    peer.on('open', () => {
      conn = peer.connect(code, { reliable: true });
      wireConn(conn, {
        onLink, onData, onError,
        onLinkClosed: () => { if (!dead && onLinkClosed) onLinkClosed(); },
      });
    });
    peer.on('error', (err) => handlePeerError(err, { onError }, dead));
    return {
      send(msg) { if (conn) { try { conn.send(msg); } catch (e) { /* канал уже мёртв */ } } },
      close() {
        dead = true;
        try { if (conn) conn.close(); } catch (e) { /* уже закрыт */ }
        try { peer.destroy(); } catch (e) { /* уже разрушен */ }
      },
    };
  }

  return { makeCode, normalize, isValid, host, join };
})();

/* Загрузка в Node без этапа сборки: в браузере module не существует. */
if (typeof module !== 'undefined' && module.exports) module.exports = Net;
