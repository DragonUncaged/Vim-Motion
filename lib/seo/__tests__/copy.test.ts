import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  DESCRIPTION_MAX,
  drillTitle,
  LESSON_INTENT,
  lessonCopy,
  lessonTitle,
  pageMetadata,
  SITE_DESCRIPTION,
  spokenKey,
  TITLE_SUFFIX,
} from '../copy.ts';
import { categories } from '@/lib/drills/categories.ts';
import { catalogue, modules } from '@/content/lessons/index.ts';
import { plainProse } from '@/lib/prose/richtext-parse.ts';

/** Google renders roughly 600px of title. 60 characters is where that runs out in practice. */
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 70;

const pages = [
  ...catalogue.map((lesson) => ({ where: `/learn/${lesson.slug}`, copy: lessonCopy(lesson) })),
];

describe('lesson copy', () => {
  it('fits a search result on every lesson', () => {
    for (const { where, copy } of pages) {
      assert.ok(
        copy.title.length <= TITLE_MAX,
        `${where}: title is ${copy.title.length} chars, over ${TITLE_MAX}: "${copy.title}"`,
      );
      assert.ok(
        copy.description.length <= DESCRIPTION_MAX,
        `${where}: description is ${copy.description.length} chars, over ${DESCRIPTION_MAX}`,
      );
      assert.ok(
        copy.description.length >= DESCRIPTION_MIN,
        `${where}: description is only ${copy.description.length} chars`,
      );
    }
  });

  it('gives every lesson a title and a description no other lesson has', () => {
    const titles = new Set(pages.map((p) => p.copy.title));
    const descriptions = new Set(pages.map((p) => p.copy.description));
    assert.equal(titles.size, pages.length, 'two lessons share a title');
    assert.equal(descriptions.size, pages.length, 'two lessons share a description');
  });

  it('sells what the site teaches, not what it costs', () => {
    const banned =
      /\b(free|no account|sign[- ]?in|sign[- ]?up|paywall|tracking|MIT licen[cs]ed)\b/i;
    const surfaces = [
      { where: 'SITE_DESCRIPTION', text: SITE_DESCRIPTION },
      ...pages.map((p) => ({ where: p.where, text: `${p.copy.title} ${p.copy.description}` })),
      ...categories.map((c) => ({ where: `/practice/${c.id}`, text: drillTitle(c) })),
    ];
    for (const { where, text } of surfaces) {
      const hit = banned.exec(text);
      assert.equal(hit, null, `${where}: copy advertises "${hit?.[0]}" — ${text}`);
    }
  });

  it('leaves no prose markup in a description', () => {
    for (const { where, copy } of pages) {
      assert.equal(
        copy.description,
        plainProse(copy.description),
        `${where}: description still carries RichText markup`,
      );
      assert.ok(!/[`*]|\[\[/.test(copy.description), `${where}: description has markup`);
    }
  });

  it('names the keys a lesson teaches when its own title is the derived one', () => {
    assert.equal(
      lessonTitle(catalogue.find((l) => l.slug === 'words')!),
      'Word motions in vim: w, e and b',
    );
  });

  it('has no intent override for a lesson that does not exist', () => {
    const slugs = new Set(catalogue.map((l) => l.slug));
    for (const slug of Object.keys(LESSON_INTENT)) {
      assert.ok(slugs.has(slug), `LESSON_INTENT names "${slug}", which is not a lesson`);
    }
  });

  it('uses the override where there is one', () => {
    for (const [slug, title] of Object.entries(LESSON_INTENT)) {
      assert.equal(lessonTitle(catalogue.find((l) => l.slug === slug)!), title);
    }
  });
});

describe('drill copy', () => {
  it('gives every category a title of its own', () => {
    const titles = categories.map(drillTitle);
    assert.equal(new Set(titles).size, categories.length, 'two drill categories share a title');
    for (const title of titles) assert.ok(title.length <= TITLE_MAX, `too long: "${title}"`);
  });

  it('does not say "vim" twice about a module named after one', () => {
    const go = categories.find((c) => c.id === 'go')!;
    assert.equal(drillTitle(go), 'Vim drill: Go');
  });
});

describe('spokenKey', () => {
  it('writes a control key the way a sentence would', () => {
    assert.equal(spokenKey('<C-d>'), 'Ctrl-d');
    assert.equal(spokenKey('C-v'), 'Ctrl-v');
    assert.equal(spokenKey('<Esc>'), 'Esc');
    assert.equal(spokenKey('dw'), 'dw');
  });
});

describe('pageMetadata', () => {
  it('builds the whole Open Graph object, because a partial one replaces the layout’s', () => {
    const meta = pageMetadata({ title: 'A title', description: 'A description.' });
    const og = meta.openGraph!;
    assert.equal(og.title, `A title${TITLE_SUFFIX}`);
    assert.equal(og.description, 'A description.');
    assert.equal((og as { siteName?: string }).siteName, 'Vim Clay');
    assert.equal((og as { type?: string }).type, 'website');
  });

  it('lets a page keep a title that already names the site', () => {
    const meta = pageMetadata({
      title: 'Vim Clay — x',
      description: 'd',
      shareTitle: 'Vim Clay — x',
    });
    assert.equal(meta.openGraph!.title, 'Vim Clay — x');
  });

  it('emits robots noindex only when asked', () => {
    assert.equal(pageMetadata({ title: 't', description: 'd' }).robots, undefined);
    assert.deepEqual(pageMetadata({ title: 't', description: 'd', noindex: true }).robots, {
      index: false,
      follow: true,
    });
  });
});

describe('the curriculum every page is built from', () => {
  it('still has a module for every lesson', () => {
    const ids = new Set(modules.map((m) => m.id));
    for (const lesson of catalogue) assert.ok(ids.has(lesson.module), lesson.slug);
  });
});
