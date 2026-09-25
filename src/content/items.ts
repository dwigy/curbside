import { BALANCE } from './balance';
import type { ItemDef } from './types';

export const ITEMS: ItemDef[] = [
  {
    id: 'sleeping_bag',
    name: 'Sleeping bag',
    desc: 'Better sleep outdoors (+8 energy a night) and halves what cold nights cost your health and life.',
    price: 22,
    shop: 'thrift',
  },
  {
    id: 'harmonica',
    name: 'Harmonica',
    desc: 'Unlocks busking. Small sound, small money.',
    price: 12,
    shop: 'pawn',
  },
  {
    id: 'guitar',
    name: 'Used guitar',
    desc: 'Busking pays about twice what the harmonica does.',
    price: 85,
    shop: 'pawn',
    visible: { hasItem: ['harmonica'] },
  },
  {
    id: 'clean_clothes',
    name: 'Clean clothes',
    desc: 'A decent outfit. +5% odds of being picked for day labor, and you feel more like yourself.',
    price: 25,
    shop: 'thrift',
    onBuy: { happiness: 4 },
  },
  {
    id: 'work_boots',
    name: 'Work boots',
    desc: 'Steel toes. Needed for day labor.',
    price: 38,
    shop: 'thrift',
  },
  {
    id: 'phone',
    name: 'Used smartphone',
    desc: 'Unlocks odd jobs and deliveries. Needs a prepaid plan to work.',
    price: 45,
    shop: 'pawn',
    onBuy: { addItem: ['phone_plan'] },
  },
  {
    id: 'phone_plan',
    name: 'Prepaid phone plan',
    desc: `${BALANCE.phone.planDays} days of service. Odd jobs and deliveries need it.`,
    price: BALANCE.phone.planCost,
    shop: 'corner',
    expiresDays: BALANCE.phone.planDays,
    requires: { hasItem: ['phone'] },
    requiresReason: 'You need a phone first.',
  },
  {
    id: 'bus_pass',
    name: 'Monthly bus pass',
    desc: `Travel between districts without losing a day. Lasts ${BALANCE.busPass.days} days.`,
    price: 30,
    shop: 'transit',
    expiresDays: BALANCE.busPass.days,
  },
  {
    id: 'bike',
    name: 'Used bike',
    desc: 'With a phone, unlocks deliveries. Without a lock, it can be stolen.',
    price: 65,
    shop: 'bikeShop',
  },
  {
    id: 'bike_lock',
    name: 'U-lock',
    desc: 'Stops bike theft.',
    price: 14,
    shop: 'bikeShop',
    visible: { hasItem: ['bike'] },
  },
  {
    id: 'dog_food',
    name: 'Bag of dog food',
    desc: 'Seven days of meals for your dog.',
    price: 9,
    shop: 'corner',
    consumable: true,
    requires: { hasDog: true },
    requiresReason: 'You don’t have a dog.',
    visible: { hasDog: true },
    onBuy: { dogFood: 7 },
  },
  {
    id: 'birth_certificate_order',
    name: 'Birth certificate (by mail)',
    desc: 'Order a certified copy. Arrives in 14 days. You need it for a State ID.',
    price: 15,
    shop: 'records',
    deliveryDays: 14,
    delivers: 'birth_certificate',
    onBuy: { setFlag: { certOrdered: true } },
    requires: { flag: ['mailAddress'] },
    requiresReason: 'They need a mailing address. Ask around; someone may let you use theirs.',
    visible: { beat: ['paperwork'] },
  },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);

/** Items that aren't sold but can be owned (found, delivered, earned). */
export const OWNED_ONLY: Record<string, { name: string; desc: string }> = {
  birth_certificate: { name: 'Birth certificate', desc: 'Certified copy. Proves you are who you say you are.' },
  state_id: { name: 'State ID', desc: 'Opens doors: bank accounts, day labor, renting a room.' },
  shopping_cart: { name: 'Shopping cart', desc: 'Collect more cans and scrap (+60% scavenging).' },
};

export function itemName(id: string): string {
  return itemById(id)?.name ?? OWNED_ONLY[id]?.name ?? id;
}
