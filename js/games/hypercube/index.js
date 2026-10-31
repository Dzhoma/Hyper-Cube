/* Дескриптор Hyper-Cube для каталога: реестр знает только этот контракт (ADR-0008). */
import { mount, unmount } from './screen.js';

export default {
  id: 'hypercube',
  nameKey: 'cat.hc.name',
  tagKey: 'cat.hc.tag',
  accent: 'cyan',
  mount,
  unmount,
};
