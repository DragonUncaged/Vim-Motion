import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATCH_ALL, inlineScriptHashes, routeOf } from '../csp-hashes.mjs';
import { effectiveHeaders, scriptHashesIn } from '../csp-check.mjs';

const SHA256_ABC = "'sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0='";

test('an inline script is hashed over its exact bytes; a src script is not a candidate', () => {
  const html = '<script>abc</script><script src="/_next/static/chunks/x.js"></script>';
  assert.deepEqual(inlineScriptHashes(html), [SHA256_ABC]);
});

test('attributes on the tag do not enter the hash, and duplicates collapse', () => {
  const html = '<script type="module">abc</script><script>abc</script><script async>abc</script>';
  assert.deepEqual(inlineScriptHashes(html), [SHA256_ABC]);
});

test('an empty page has no hashes rather than a hash of nothing', () => {
  assert.deepEqual(inlineScriptHashes('<p>no scripts</p>'), []);
});

test('files map to routes the way next start resolves them', () => {
  assert.equal(routeOf('index.html'), '/');
  assert.equal(routeOf('learn/modes.html'), '/learn/modes');
  assert.equal(
    routeOf('practice/speedrun.big-words.one-jump.html'),
    '/practice/speedrun.big-words.one-jump',
  );
  assert.equal(routeOf('_not-found.html'), CATCH_ALL);
});

test('every matching rule applies, and a later match overwrites an earlier one', () => {
  const rules = [
    {
      source: '/(.*)',
      regex: '^(?:/(.*))(?:/)?$',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: 'catch-all' },
      ],
    },
    {
      source: '/learn',
      regex: '^/learn(?:/)?$',
      headers: [{ key: 'Content-Security-Policy', value: 'learn' }],
    },
  ];
  const learn = effectiveHeaders(rules, '/learn');
  assert.equal(learn.get('content-security-policy'), 'learn');
  assert.equal(learn.get('x-frame-options'), 'DENY', 'the catch-all still supplies the rest');
  assert.equal(effectiveHeaders(rules, '/learn/modes').get('content-security-policy'), 'catch-all');
  assert.equal(
    effectiveHeaders([...rules].reverse(), '/learn').get('content-security-policy'),
    'catch-all',
  );
});

test('only script-src hashes count; the same token elsewhere is not permission to run', () => {
  const csp =
    "default-src 'self'; style-src 'sha256-nope='; script-src 'self' 'sha256-a=' 'sha256-b='; object-src 'none'";
  assert.deepEqual([...scriptHashesIn(csp)], ["'sha256-a='", "'sha256-b='"]);
  assert.deepEqual([...scriptHashesIn("default-src 'self'")], []);
});
