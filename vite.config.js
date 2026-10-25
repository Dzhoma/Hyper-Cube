import { defineConfig } from 'vite';

/*
 * base './' — относительные пути ассетов в сборке: сайт живёт в подпапке
 * /Hyper-Cube/ на GitHub Pages, абсолютный корень туда не подходит.
 */
export default defineConfig({
  base: './',
});
