import assert from "node:assert/strict";
import { test } from "node:test";
import { consume, deliver, DELIVERY_S, initialInventory, placeOrder, stockLevel, SUPPLY_IDS, SUPPLIES } from "./inventory.ts";

test("stock starts full and drains with horses and time, never below zero", () => {
  const inv = initialInventory();
  for (const id of SUPPLY_IDS) assert.equal(inv.stock[id], SUPPLIES[id].capacity);

  const after = consume(inv, 10, 30);
  for (const id of SUPPLY_IDS) assert.ok(after.stock[id] < inv.stock[id], `${id} should drain`);
  assert.deepEqual(consume(inv, 0, 30).stock, inv.stock, "no horses → nothing used");
  assert.deepEqual(consume(inv, 10, 0).stock, inv.stock, "paused → nothing used");

  const empty = consume(inv, 36, 1e9);
  for (const id of SUPPLY_IDS) assert.equal(empty.stock[id], 0);
  assert.equal(inv.stock.HAY, SUPPLIES.HAY.capacity, "consume does not mutate its input");
});

test("stock levels: OK above a quarter, LOW below, OUT at zero", () => {
  const inv = initialInventory();
  const cap = SUPPLIES.HAY.capacity;
  assert.equal(stockLevel({ ...inv, stock: { ...inv.stock, HAY: cap } }, "HAY"), "OK");
  assert.equal(stockLevel({ ...inv, stock: { ...inv.stock, HAY: cap * 0.2 } }, "HAY"), "LOW");
  assert.equal(stockLevel({ ...inv, stock: { ...inv.stock, HAY: 0 } }, "HAY"), "OUT");
});

test("an order tops the item back up to capacity once the truck arrives", () => {
  let inv = consume(initialInventory(), 10, 60);
  const before = inv.stock.FEED;
  inv = placeOrder(inv, "FEED", 100);
  assert.equal(inv.orders.length, 1);
  assert.equal(inv.orders[0].qty, SUPPLIES.FEED.capacity - before);
  assert.equal(placeOrder(inv, "FEED", 101), inv, "only one pending order per item");

  const early = deliver(inv, 100 + DELIVERY_S - 1);
  assert.equal(early.arrived.length, 0);
  assert.equal(early.inventory, inv);

  const done = deliver(inv, 100 + DELIVERY_S);
  assert.equal(done.arrived.length, 1);
  assert.equal(done.inventory.orders.length, 0);
  assert.equal(done.inventory.stock.FEED, SUPPLIES.FEED.capacity);
});

test("ordering a full item does nothing", () => {
  const inv = initialInventory();
  assert.equal(placeOrder(inv, "HAY", 0), inv);
});

test("orders placed while a truck is on its way ride the same truck", () => {
  let inv = consume(initialInventory(), 10, 60);
  inv = placeOrder(inv, "HAY", 0);
  inv = placeOrder(inv, "FEED", 3);
  assert.deepEqual(inv.orders.map((o) => o.arriveAt), [DELIVERY_S, DELIVERY_S]);
  assert.equal(deliver(inv, DELIVERY_S).arrived.length, 2);
});
