import assert from 'node:assert/strict';
import test from 'node:test';
import { dirtTile, dirtTiles, fillRect, ring, stadiumRing, type Mask } from './autotile.ts';

test('dirtTile maps all sixteen neighbor combinations into the 4×4 source block', () => {
  const cases: [boolean, boolean, boolean, boolean, number, number][] = [
    [false, false, false, false, 0, 0],
    [false, false, false, true, 3, 3],
    [false, false, true, false, 0, 1],
    [false, false, true, true, 3, 0],
    [false, true, false, false, 1, 3],
    [false, true, false, true, 2, 3],
    [false, true, true, false, 1, 0],
    [false, true, true, true, 2, 0],
    [true, false, false, false, 0, 3],
    [true, false, false, true, 3, 2],
    [true, false, true, false, 0, 2],
    [true, false, true, true, 3, 1],
    [true, true, false, false, 1, 2],
    [true, true, false, true, 2, 2],
    [true, true, true, false, 1, 1],
    [true, true, true, true, 2, 1],
  ];
  for (const [n, e, s, w, c, r] of cases) {
    assert.deepEqual(dirtTile(n, e, s, w), { c, r });
    assert.ok(c >= 0 && c <= 3 && r >= 0 && r <= 3);
  }
});

test('ring removes three stepped outside corners and its interior', () => {
  const mask: Mask = Array.from({ length: 48 }, () => Array(80).fill(false));
  ring(mask, 2, 28, 77, 46, 3);
  assert.equal(mask[28][2], false);
  assert.equal(mask[28][4], false);
  assert.equal(mask[29][2], false);
  assert.equal(mask[28][5], true);
  assert.equal(mask[30][2], false);
  assert.equal(mask[31][2], true);
  assert.equal(mask[31][5], false);
});

test('dirtTiles joins the vertical path to the race ring', () => {
  const mask: Mask = Array.from({ length: 48 }, () => Array(80).fill(false));
  fillRect(mask, 39, 16, 40, 27);
  ring(mask, 2, 28, 77, 46, 3);
  const tiles = dirtTiles(mask);
  const pathEdge = tiles.find(({ x, y }) => x === 39 && y === 27);
  const joinedRing = tiles.find(({ x, y }) => x === 39 && y === 28);
  assert.ok(pathEdge);
  assert.equal(mask[28][39], true);
  assert.ok(joinedRing);
  assert.notEqual(joinedRing.r, 0);
});


test('stadiumRing is a closed oval band: straights are w tiles thick, centre and corners stay grass', () => {
  const m: Mask = Array.from({ length: 20 }, () => Array<boolean>(40).fill(false));
  stadiumRing(m, 0, 0, 39, 19, 3);
  const col = (x: number) => m.map((row) => row[x]);
  assert.deepEqual(col(20).map((v, y) => (v ? y : -1)).filter((y) => y >= 0), [0, 1, 2, 17, 18, 19]);
  assert.equal(m[10][20], false, 'infield is grass');
  assert.equal(m[0][0] || m[19][39], false, 'rounded ends leave the corners empty');
  assert.equal(m[10][0] && m[10][39], true, 'ends reach the outer edge at the middle row');
  assert.ok(dirtTiles(m).length > 0);
});
