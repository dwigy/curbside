import type { FoodDef } from './types';

export const FOODS: FoodDef[] = [
  {
    id: 'kitchen',
    name: 'Free lunch at the {kitchen}',
    desc: 'Once a day, closed Sundays. Only in {riverfront}.',
    price: 0,
    food: 45,
    quality: 55,
    happiness: 1,
    kitchen: true,
  },
  {
    id: 'dumpster',
    name: 'Dumpster dive behind the bakery',
    desc: 'Free. Sometimes it’s fine. Sometimes it isn’t.',
    price: 0,
    food: 20,
    quality: 10,
    happiness: -2,
    risk: { chance: 0.12, health: -8, text: 'Something in there was off. Your stomach turns for a day.' },
  },
  { id: 'bread', name: 'Day-old loaf', desc: 'Filling enough. Not much else.', price: 2, food: 22, quality: 20 },
  { id: 'hotdog', name: 'Hot dog from the cart', desc: 'Warm, salty, gone in four bites.', price: 4, food: 30, quality: 25, happiness: 1 },
  { id: 'fruit', name: 'Fruit and yogurt', desc: 'Not much food, but good food.', price: 5, food: 20, quality: 85, happiness: 1 },
  { id: 'sandwich', name: 'Deli sandwich', desc: 'A real meal from {corner}.', price: 6, food: 40, quality: 45, happiness: 1 },
  {
    id: 'groceries',
    name: 'Cook a proper meal',
    desc: 'Groceries for the shared kitchen. Cheap, healthy, filling.',
    price: 7,
    food: 50,
    quality: 75,
    happiness: 2,
    requires: { housing: ['room_albescu', 'room_canal'] },
    requiresReason: 'You need somewhere with a kitchen.',
  },
  { id: 'diner', name: 'Diner plate', desc: 'Sit down. Coffee refills. Feel human.', price: 12, food: 65, quality: 55, happiness: 5 },
];

export const foodById = (id: string) => FOODS.find((f) => f.id === id);
