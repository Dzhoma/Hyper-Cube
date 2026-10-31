/*
 * Реестр игр аркады (ADR-0008). Добавить игру:
 *   1) модуль js/games/<id>/ с default-экспортом дескриптора
 *      { id, nameKey, tagKey, accent, mount, unmount };
 *   2) одна строка в списке ниже.
 */
import hypercube from './hypercube/index.js';
import snake from './snake/index.js';

const registry = [hypercube, snake];

export default registry;
