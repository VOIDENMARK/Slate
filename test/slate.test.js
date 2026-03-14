import test from 'node:test';
import assert from 'node:assert/strict';

import {
  Slate,
  DELIVERY_PHASES,
  buildExecutionPlan,
  completeDeliverable,
  executionProgress
} from '../src/index.js';

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

test('supports search and kind filtering for app-style discovery', () => {
  const slate = new Slate();
  slate.addSurface({ id: '1', title: 'Sprint Board', kind: 'board', tags: ['work'] });
  slate.addSurface({ id: '2', title: 'Daily Notes', kind: 'note', tags: ['journal'] });

  assert.equal(slate.search('sprint').length, 1);
  assert.equal(slate.search('board').length, 1);
  assert.equal(slate.byKind('note').length, 1);
});

test('builds UI card payloads', () => {
  const slate = new Slate();
  slate.addSurface({ id: 'alpha', title: 'Alpha', kind: 'dashboard', tags: ['focus', 'team'] });

  const cards = slate.cards('alp');
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0], {
    id: 'alpha',
    title: 'Alpha',
    subtitle: 'DASHBOARD · 2 tags',
    kind: 'dashboard',
    badges: ['focus', 'team']
  });
});

test('search ranks exact and partial matches', () => {
  const slate = new Slate();

  slate.addSurface({ id: '1', title: 'Roadmap', kind: 'note', tags: ['planning'] });
  slate.addSurface({ id: '2', title: 'Roadmap Q4', kind: 'note', tags: ['planning', 'q4'] });
  slate.addSurface({ id: '3', title: 'Q4 Notes', kind: 'note', tags: ['q4'] });

  const matches = slate.search('roadmap');

  assert.deepEqual(
    matches.map((surface) => surface.id),
    ['1', '2']
  );
});

test('search supports filters and limits', () => {
  const slate = new Slate();

  slate.addSurface({ id: 'a', title: 'Home Dashboard', kind: 'dashboard', tags: ['core'] });
  slate.addSurface({ id: 'b', title: 'Finance Dashboard', kind: 'dashboard', tags: ['finance'] });
  slate.addSurface({ id: 'c', title: 'Finance Notes', kind: 'note', tags: ['finance'] });

  const financeDashboards = slate.search('finance', { kind: 'dashboard', tag: 'finance', limit: 1 });
  assert.equal(financeDashboards.length, 1);
  assert.equal(financeDashboards[0].id, 'b');

  const emptyQuery = slate.search('   ');
  assert.equal(emptyQuery.length, 3);

  const filteredEmptyQuery = slate.search('', { kind: 'dashboard' });
  assert.deepEqual(
    filteredEmptyQuery.map((surface) => surface.id),
    ['b', 'a']
  );
});

test('contains all requested delivery phases in order', () => {
  assert.equal(DELIVERY_PHASES.length, 8);
  assert.deepEqual(
    DELIVERY_PHASES.map((phase) => phase.name),
    [
      'Foundation',
      'Browser Module',
      'Notes Module',
      'Communication',
      'Media',
      'Code & Work',
      'Advanced Features',
      'Polish & Optimization'
    ]
  );

  const executionPlan = buildExecutionPlan();
  assert.equal(executionPlan[0].status, 'pending');
  assert.deepEqual(executionPlan[0].completedDeliverables, []);
});


test('tracks execution progress as deliverables are completed', () => {
  const plan = buildExecutionPlan();
  assert.equal(executionProgress(plan), 0);

  const foundation = completeDeliverable(plan[0], 'Database initialization');
  const updatedPlan = [foundation, ...plan.slice(1)];

  assert.equal(foundation.status, 'in_progress');
  assert.ok(executionProgress(updatedPlan) > 0);

  assert.throws(
    () => completeDeliverable(plan[0], 'Does not exist'),
    /Unknown deliverable/
  );
});
