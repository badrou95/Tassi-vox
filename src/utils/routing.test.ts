import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateReadingMinutes,
  extractLanguageFromPath,
  formatReadingTime,
  resolveArticleLocale,
  slugifyTitle,
  switchLocalePath,
} from './routing';
import { DEFAULT_ARTICLES } from '../data/seedData';

test('switchLocalePath switches cleanly between /fr/... and /ar/... while preserving subpaths', () => {
  assert.equal(switchLocalePath('/fr', 'ar'), '/ar');
  assert.equal(switchLocalePath('/ar', 'fr'), '/fr');
  assert.equal(switchLocalePath('/fr/article/mon-slug', 'ar'), '/ar/article/mon-slug');
  assert.equal(switchLocalePath('/ar/equipe/karim-benali', 'fr'), '/fr/equipe/karim-benali');
  assert.equal(switchLocalePath('/admin', 'ar'), '/admin');
});

test('extractLanguageFromPath identifies fr and ar routes accurately', () => {
  assert.equal(extractLanguageFromPath('/fr/soumettre'), 'fr');
  assert.equal(extractLanguageFromPath('/ar/contact'), 'ar');
  assert.equal(extractLanguageFromPath('/admin'), null);
});

test('slugifyTitle produces Firestore-safe lowercase alphanumeric-dash slugs', () => {
  assert.equal(slugifyTitle('Sommet Énergétique : 2026 !'), 'sommet-energetique-2026');
  assert.match(slugifyTitle('À la une — Méditerranée'), /^[a-z0-9-]+$/);
});

test('resolveArticleLocale never silently pretends unvalidated translation is ready', () => {
  const frOnly = {
    ...DEFAULT_ARTICLES[0],
    ar: { ...DEFAULT_ARTICLES[0].ar, ready: false, title: '' },
  };
  const resolved = resolveArticleLocale(frOnly, 'ar');
  assert.equal(resolved.actualLang, 'fr');
  assert.equal(resolved.isFallback, true);

  const bothReady = resolveArticleLocale(DEFAULT_ARTICLES[0], 'ar');
  assert.equal(bothReady.actualLang, 'ar');
  assert.equal(bothReady.isFallback, false);
});

test('estimateReadingMinutes and formatReadingTime handle FR and AR grammar cleanly', () => {
  assert.equal(estimateReadingMinutes('court texte'), 1);
  assert.equal(estimateReadingMinutes('mot '.repeat(450)), 3);
  assert.equal(formatReadingTime(1, 'ar'), 'دقيقة للقراءة');
  assert.equal(formatReadingTime(2, 'ar'), 'دقيقتان للقراءة');
  assert.equal(formatReadingTime(4, 'ar'), '4 دقائق للقراءة');
  assert.equal(formatReadingTime(3, 'fr'), '3 min de lecture');
});
