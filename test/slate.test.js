import test from 'node:test';
import assert from 'node:assert/strict';

import { Slate } from '../src/index.js';

test('adds and retrieves surfaces', () => {
  const slate = new Slate();

  slate.addSurface({
    id: 'home',
    title: 'Home Dashboard',
    kind: 'dashboard',
    tags: ['core', 'daily']
  });

  const home = slate.getSurface('home');
  assert.ok(home);
  assert.equal(home.title, 'Home Dashboard');
});

test('filters by tag', () => {
  const slate = new Slate();

  slate.addSurface({ id: 'a', title: 'A', tags: ['x'] });
  slate.addSurface({ id: 'b', title: 'B', tags: ['y'] });
  slate.addSurface({ id: 'c', title: 'C', tags: ['x', 'z'] });

  const xSurfaces = slate.byTag('x');
  assert.equal(xSurfaces.length, 2);
  assert.deepEqual(
    xSurfaces.map((surface) => surface.id),
    ['a', 'c']
  );
});

test('throws on duplicate ids', () => {
  const slate = new Slate();

  slate.addSurface({ id: 'dup', title: 'Original' });

  assert.throws(
    () => slate.addSurface({ id: 'dup', title: 'Collision' }),
    /already exists/
  );
});
