/*
 * Общий UI-набор аркады: статический i18n-рендер и сегментные переключатели.
 * Экраны игр импортируют отсюда, чтобы не дублировать механику.
 */
import AudioFX from './audio.js';
import { t } from './i18n.js';

/* статика по data-i18n / data-i18n-html; params — подстановки {placeholder} */
export function applyStaticI18n(params) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n, params);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml, params);
  });
}

/* сегмент-переключатель: активная кнопка получает .active, выбор уходит в onPick */
export function wireSeg(sel, onPick) {
  const seg = document.querySelector(sel);
  if (!seg) return;
  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn || btn.classList.contains('active')) return;
    seg.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
    AudioFX.click();
    onPick(btn.dataset.value);
  });
}
