#!/usr/bin/env node
// Generates backend/src/main/resources/db/migration/V2__seed_data.sql.
// Fully deterministic: seeded PRNG only, no Date.now, no Math.random.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../backend/src/main/resources/db/migration/V2__seed_data.sql'
);

const SEED = 20260725;
const REF_YEAR = 2026;
// BCrypt hash of "demo1234", generated once with Spring Security BCryptPasswordEncoder.
const DEMO_PASSWORD_HASH = '$2a$10$HZbHdD.DtCH7/HBnkkYtauSY1YTQWCa30XZVOXnuAxFpKOM8lIagy';
const LISTING_COUNT = 220;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);
const randInt = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const weighted = (pairs) => {
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let r = rand() * total;
  for (const [value, w] of pairs) {
    r -= w;
    if (r <= 0) return value;
  }
  return pairs[pairs.length - 1][0];
};
const chance = (p) => rand() < p;

const TRIMS = {
  VW: ['Life', 'Style', 'R-Line', 'Comfortline', 'Highline', 'United'],
  BMW: ['Advantage', 'Sport Line', 'Luxury Line', 'M Sport'],
  'Mercedes-Benz': ['Avantgarde', 'AMG Line', 'Progressive', 'Exclusive'],
  Audi: ['Sport', 'S line', 'Advanced', 'Design'],
  Opel: ['Edition', 'Elegance', 'GS Line', 'Innovation'],
  Ford: ['Titanium', 'ST-Line', 'Cool & Connect', 'Trend'],
  'Škoda': ['Ambition', 'Style', 'Sportline', 'Clever'],
  Toyota: ['Comfort', 'Team Deutschland', 'Lounge', 'Club'],
  Renault: ['Zen', 'Intens', 'Techno', 'Equilibre'],
  Hyundai: ['Trend', 'Prime', 'N Line', 'Select'],
  Tesla: []
};

// powers are kW, ascending; badge index follows the power percentile
const CATALOG = [
  {
    make: 'VW', model: 'Golf', from: 2008, newPrice: 32000, price: [2500, 34000],
    bodies: [['HATCHBACK', 8], ['ESTATE', 3]],
    fuels: [['PETROL', 10], ['DIESEL', 7], ['PLUG_IN_HYBRID', 1], ['LPG', 2]],
    powers: [77, 85, 96, 110, 132, 140],
    badges: { PETROL: ['1.0 TSI', '1.2 TSI', '1.4 TSI', '1.5 TSI', '2.0 TSI'], DIESEL: ['1.6 TDI', '2.0 TDI'], PLUG_IN_HYBRID: ['1.4 eHybrid', '1.4 GTE'], LPG: ['1.4 BiFuel'] }
  },
  {
    make: 'VW', model: 'Passat', from: 2008, newPrice: 42000, price: [3000, 44000],
    bodies: [['ESTATE', 7], ['SEDAN', 3]],
    fuels: [['DIESEL', 10], ['PETROL', 5], ['PLUG_IN_HYBRID', 2]],
    powers: [90, 110, 125, 140, 147, 176],
    badges: { PETROL: ['1.4 TSI', '1.5 TSI', '2.0 TSI'], DIESEL: ['1.6 TDI', '2.0 TDI', '2.0 TDI SCR'], PLUG_IN_HYBRID: ['1.4 GTE'] }
  },
  {
    make: 'VW', model: 'Tiguan', from: 2009, newPrice: 43000, price: [4500, 46000],
    bodies: [['SUV', 10]],
    fuels: [['DIESEL', 9], ['PETROL', 7], ['PLUG_IN_HYBRID', 2]],
    powers: [96, 110, 125, 140, 162, 180],
    badges: { PETROL: ['1.4 TSI', '1.5 TSI', '2.0 TSI'], DIESEL: ['2.0 TDI', '2.0 TDI 4Motion'], PLUG_IN_HYBRID: ['1.4 eHybrid'] }
  },
  {
    make: 'VW', model: 'Polo', from: 2009, newPrice: 23000, price: [1900, 20000],
    bodies: [['HATCHBACK', 10]],
    fuels: [['PETROL', 12], ['DIESEL', 3], ['LPG', 2]],
    powers: [55, 59, 66, 70, 85],
    badges: { PETROL: ['1.0', '1.0 TSI', '1.2 TSI', '1.4 TSI'], DIESEL: ['1.4 TDI', '1.6 TDI'], LPG: ['1.4 BiFuel'] }
  },
  {
    make: 'VW', model: 'ID.3', from: 2020, newPrice: 42000, price: [16000, 42000],
    bodies: [['HATCHBACK', 10]],
    fuels: [['ELECTRIC', 10]],
    powers: [107, 110, 125, 150],
    badges: { ELECTRIC: ['Pure Performance', 'Pro', 'Pro Performance', 'Pro S'] }
  },
  {
    make: 'BMW', model: '3 Series', from: 2008, newPrice: 52000, price: [3500, 56000],
    bodies: [['SEDAN', 7], ['ESTATE', 4], ['COUPE', 2]],
    fuels: [['DIESEL', 10], ['PETROL', 7], ['PLUG_IN_HYBRID', 2]],
    powers: [110, 120, 135, 140, 155, 190, 210],
    badges: { PETROL: ['318i', '320i', '330i'], DIESEL: ['318d', '320d', '330d'], PLUG_IN_HYBRID: ['330e'] }
  },
  {
    make: 'BMW', model: '5 Series', from: 2008, newPrice: 68000, price: [5500, 62000],
    bodies: [['SEDAN', 6], ['ESTATE', 4]],
    fuels: [['DIESEL', 10], ['PETROL', 5], ['PLUG_IN_HYBRID', 2]],
    powers: [135, 140, 160, 185, 195, 210, 250],
    badges: { PETROL: ['520i', '530i', '540i'], DIESEL: ['520d', '530d', '540d'], PLUG_IN_HYBRID: ['530e'] }
  },
  {
    make: 'BMW', model: 'X3', from: 2011, newPrice: 62000, price: [7000, 60000],
    bodies: [['SUV', 10]],
    fuels: [['DIESEL', 10], ['PETROL', 6], ['PLUG_IN_HYBRID', 2]],
    powers: [110, 135, 140, 155, 185, 210],
    badges: { PETROL: ['xDrive20i', 'xDrive30i'], DIESEL: ['xDrive18d', 'xDrive20d', 'xDrive30d'], PLUG_IN_HYBRID: ['xDrive30e'] }
  },
  {
    make: 'BMW', model: '1 Series', from: 2008, newPrice: 38000, price: [2800, 38000],
    bodies: [['HATCHBACK', 10]],
    fuels: [['PETROL', 9], ['DIESEL', 8]],
    powers: [85, 100, 103, 120, 135, 165],
    badges: { PETROL: ['116i', '118i', '120i', '128ti'], DIESEL: ['116d', '118d', '120d'] }
  },
  {
    make: 'Mercedes-Benz', model: 'C-Class', from: 2008, newPrice: 54000, price: [3800, 56000],
    bodies: [['SEDAN', 6], ['ESTATE', 5], ['COUPE', 2], ['CONVERTIBLE', 2]],
    fuels: [['DIESEL', 10], ['PETROL', 7], ['PLUG_IN_HYBRID', 2]],
    powers: [100, 115, 125, 143, 150, 190],
    badges: { PETROL: ['C 180', 'C 200', 'C 300'], DIESEL: ['C 180 d', 'C 200 d', 'C 220 d', 'C 300 d'], PLUG_IN_HYBRID: ['C 300 e'] }
  },
  {
    make: 'Mercedes-Benz', model: 'E-Class', from: 2008, newPrice: 66000, price: [5000, 62000],
    bodies: [['SEDAN', 6], ['ESTATE', 4]],
    fuels: [['DIESEL', 11], ['PETROL', 5], ['PLUG_IN_HYBRID', 2]],
    powers: [120, 143, 145, 170, 180, 210, 245],
    badges: { PETROL: ['E 200', 'E 300', 'E 350'], DIESEL: ['E 200 d', 'E 220 d', 'E 300 d'], PLUG_IN_HYBRID: ['E 300 e'] }
  },
  {
    make: 'Mercedes-Benz', model: 'GLC', from: 2015, newPrice: 62000, price: [12000, 60000],
    bodies: [['SUV', 10]],
    fuels: [['DIESEL', 10], ['PETROL', 6], ['PLUG_IN_HYBRID', 3]],
    powers: [120, 143, 145, 170, 190],
    badges: { PETROL: ['GLC 200', 'GLC 300'], DIESEL: ['GLC 200 d', 'GLC 220 d', 'GLC 300 d'], PLUG_IN_HYBRID: ['GLC 300 e'] }
  },
  {
    make: 'Mercedes-Benz', model: 'A-Class', from: 2012, newPrice: 39000, price: [4500, 40000],
    bodies: [['HATCHBACK', 10]],
    fuels: [['PETROL', 9], ['DIESEL', 7], ['PLUG_IN_HYBRID', 1]],
    powers: [80, 100, 120, 140, 165],
    badges: { PETROL: ['A 160', 'A 180', 'A 200', 'A 250'], DIESEL: ['A 180 d', 'A 200 d', 'A 220 d'], PLUG_IN_HYBRID: ['A 250 e'] }
  },
  {
    make: 'Audi', model: 'A3', from: 2008, newPrice: 38000, price: [2800, 40000],
    bodies: [['HATCHBACK', 8], ['CONVERTIBLE', 2]],
    fuels: [['PETROL', 9], ['DIESEL', 8], ['PLUG_IN_HYBRID', 1]],
    powers: [77, 85, 110, 116, 140],
    badges: { PETROL: ['30 TFSI', '35 TFSI', '40 TFSI'], DIESEL: ['30 TDI', '35 TDI', '2.0 TDI'], PLUG_IN_HYBRID: ['40 TFSI e'] }
  },
  {
    make: 'Audi', model: 'A4', from: 2008, newPrice: 48000, price: [3200, 50000],
    bodies: [['SEDAN', 5], ['ESTATE', 6]],
    fuels: [['DIESEL', 11], ['PETROL', 6], ['PLUG_IN_HYBRID', 1]],
    powers: [100, 110, 120, 140, 150, 183],
    badges: { PETROL: ['30 TFSI', '35 TFSI', '40 TFSI', '45 TFSI'], DIESEL: ['30 TDI', '35 TDI', '40 TDI'], PLUG_IN_HYBRID: ['40 TFSI e'] }
  },
  {
    make: 'Audi', model: 'A6', from: 2008, newPrice: 64000, price: [4500, 60000],
    bodies: [['SEDAN', 5], ['ESTATE', 6]],
    fuels: [['DIESEL', 11], ['PETROL', 4], ['PLUG_IN_HYBRID', 2]],
    powers: [120, 140, 150, 170, 210, 250],
    badges: { PETROL: ['40 TFSI', '45 TFSI', '55 TFSI'], DIESEL: ['40 TDI', '45 TDI', '50 TDI'], PLUG_IN_HYBRID: ['50 TFSI e'] }
  },
  {
    make: 'Audi', model: 'Q5', from: 2010, newPrice: 60000, price: [6500, 58000],
    bodies: [['SUV', 10]],
    fuels: [['DIESEL', 10], ['PETROL', 6], ['PLUG_IN_HYBRID', 2]],
    powers: [120, 140, 150, 170, 195],
    badges: { PETROL: ['35 TFSI', '40 TFSI', '45 TFSI'], DIESEL: ['35 TDI', '40 TDI quattro', '50 TDI quattro'], PLUG_IN_HYBRID: ['50 TFSI e quattro'] }
  },
  {
    make: 'Opel', model: 'Corsa', from: 2008, newPrice: 21000, price: [1500, 19000],
    bodies: [['HATCHBACK', 10]],
    fuels: [['PETROL', 12], ['DIESEL', 3], ['LPG', 3]],
    powers: [51, 55, 66, 74, 96],
    badges: { PETROL: ['1.2', '1.4', '1.2 Turbo'], DIESEL: ['1.3 CDTI', '1.5 Diesel'], LPG: ['1.4 LPG'] }
  },
  {
    make: 'Opel', model: 'Astra', from: 2008, newPrice: 28000, price: [1800, 27000],
    bodies: [['HATCHBACK', 7], ['ESTATE', 4]],
    fuels: [['PETROL', 9], ['DIESEL', 7], ['LPG', 2]],
    powers: [66, 81, 92, 110, 125],
    badges: { PETROL: ['1.4 Turbo', '1.2 Turbo', '1.6 Turbo'], DIESEL: ['1.6 CDTI', '1.5 Diesel', '2.0 CDTI'], LPG: ['1.4 LPG'] }
  },
  {
    make: 'Ford', model: 'Focus', from: 2008, newPrice: 28000, price: [1800, 27000],
    bodies: [['HATCHBACK', 7], ['ESTATE', 4]],
    fuels: [['PETROL', 9], ['DIESEL', 7]],
    powers: [74, 92, 110, 114, 134],
    badges: { PETROL: ['1.0 EcoBoost', '1.5 EcoBoost', '1.6 Ti-VCT'], DIESEL: ['1.5 TDCi', '2.0 TDCi'] }
  },
  {
    make: 'Ford', model: 'Fiesta', from: 2008, newPrice: 21000, price: [1500, 19000],
    bodies: [['HATCHBACK', 10]],
    fuels: [['PETROL', 12], ['DIESEL', 3]],
    powers: [51, 55, 74, 92],
    badges: { PETROL: ['1.1', '1.0 EcoBoost', '1.25'], DIESEL: ['1.5 TDCi'] }
  },
  {
    make: 'Škoda', model: 'Octavia', from: 2008, newPrice: 32000, price: [2200, 33000],
    bodies: [['ESTATE', 7], ['HATCHBACK', 4]],
    fuels: [['DIESEL', 9], ['PETROL', 8], ['LPG', 2]],
    powers: [77, 85, 110, 116, 140],
    badges: { PETROL: ['1.0 TSI', '1.4 TSI', '1.5 TSI', '2.0 TSI'], DIESEL: ['1.6 TDI', '2.0 TDI'], LPG: ['1.4 G-TEC'] }
  },
  {
    make: 'Škoda', model: 'Fabia', from: 2008, newPrice: 21000, price: [1500, 19000],
    bodies: [['HATCHBACK', 8], ['ESTATE', 2]],
    fuels: [['PETROL', 12], ['DIESEL', 3]],
    powers: [51, 55, 66, 70, 81],
    badges: { PETROL: ['1.0 MPI', '1.0 TSI', '1.2 TSI'], DIESEL: ['1.4 TDI', '1.6 TDI'] }
  },
  {
    make: 'Toyota', model: 'Corolla', from: 2013, newPrice: 32000, price: [3500, 33000],
    bodies: [['HATCHBACK', 6], ['ESTATE', 4]],
    fuels: [['HYBRID', 10], ['PETROL', 4]],
    powers: [85, 90, 103, 116, 146],
    badges: { PETROL: ['1.2 Turbo', '1.6 Valvematic'], HYBRID: ['1.8 Hybrid', '2.0 Hybrid'] }
  },
  {
    make: 'Toyota', model: 'Yaris', from: 2009, newPrice: 24000, price: [1800, 23000],
    bodies: [['HATCHBACK', 10]],
    fuels: [['HYBRID', 8], ['PETROL', 6]],
    powers: [51, 54, 66, 74, 85, 96],
    badges: { PETROL: ['1.0', '1.5 Dual VVT-i'], HYBRID: ['1.5 Hybrid'] }
  },
  {
    make: 'Renault', model: 'Clio', from: 2008, newPrice: 22000, price: [1500, 20000],
    bodies: [['HATCHBACK', 9], ['ESTATE', 1]],
    fuels: [['PETROL', 10], ['DIESEL', 4], ['LPG', 2], ['HYBRID', 2]],
    powers: [49, 55, 66, 74, 96],
    badges: { PETROL: ['SCe 65', 'TCe 90', 'TCe 100', 'TCe 130'], DIESEL: ['dCi 85', 'Blue dCi 100'], LPG: ['TCe 100 LPG'], HYBRID: ['E-Tech 140'] }
  },
  {
    make: 'Hyundai', model: 'i30', from: 2010, newPrice: 27000, price: [2200, 26000],
    bodies: [['HATCHBACK', 7], ['ESTATE', 3]],
    fuels: [['PETROL', 10], ['DIESEL', 5]],
    powers: [73, 88, 100, 103, 118, 150],
    badges: { PETROL: ['1.0 T-GDI', '1.4 T-GDI', '1.5 T-GDI', '2.0 T-GDI'], DIESEL: ['1.6 CRDi'] }
  },
  {
    make: 'Tesla', model: 'Model 3', from: 2019, newPrice: 55000, price: [22000, 55000],
    bodies: [['SEDAN', 10]],
    fuels: [['ELECTRIC', 10]],
    powers: [208, 239, 261, 324],
    badges: { ELECTRIC: ['Standard Range Plus', 'Long Range', 'Long Range AWD', 'Performance'] }
  }
];

const COLORS = [
  ['Black', 22], ['Grey', 20], ['White', 17], ['Silver', 10], ['Blue', 12],
  ['Red', 8], ['Green', 3], ['Brown', 3], ['Beige', 2], ['Yellow', 1], ['Orange', 1]
];

const AREA_CODES = {
  Hamburg: '40',
  Norderstedt: '40',
  Pinneberg: '4101',
  'Lübeck': '451',
  Kiel: '431',
  Bremen: '421',
  Buchholz: '4181',
  Elmshorn: '4121'
};

const SELLERS = [
  { name: 'Autohaus Nordlicht', city: 'Hamburg', dealer: true, count: 18 },
  { name: 'Elbe Automobile', city: 'Hamburg', dealer: true, count: 17 },
  { name: 'Hanse Car Center', city: 'Lübeck', dealer: true, count: 19 },
  { name: 'Autozentrum Holstein', city: 'Kiel', dealer: true, count: 16 },
  { name: 'Nordwerk Motors', city: 'Bremen', dealer: true, count: 20 },
  { name: 'Autohaus Pinnau', city: 'Pinneberg', dealer: true, count: 15 },
  { name: 'Jens Petersen', city: 'Norderstedt', dealer: false, count: 18 },
  { name: 'Katrin Vogel', city: 'Elmshorn', dealer: false, count: 17 },
  { name: 'Michael Brandt', city: 'Buchholz', dealer: false, count: 19 },
  { name: 'Sabine Reuter', city: 'Kiel', dealer: false, count: 16 },
  { name: 'Thomas Krüger', city: 'Hamburg', dealer: false, count: 21 },
  { name: 'Lena Hoffmann', city: 'Bremen', dealer: false, count: 16 }
];

const DOORS = { HATCHBACK: [3, 5], SEDAN: [4], ESTATE: [5], SUV: [5], COUPE: [2, 3], CONVERTIBLE: [2], VAN: [5], PICKUP: [4] };
const SEATS = { HATCHBACK: [5], SEDAN: [5], ESTATE: [5], SUV: [5], COUPE: [4], CONVERTIBLE: [4], VAN: [7], PICKUP: [5] };

const OPENERS = [
  'Well maintained {model} with a complete service history from an authorised workshop.',
  'Carefully driven {model} in {color}, kept garaged and always serviced on time.',
  'Second owner {model} that has spent most of its life on longer motorway runs.',
  'Clean {model} with a full stamp book and no accident history.',
  'Tidy {model} sold directly by its owner in {city}, ready to drive away.',
  'Reliable {model} that has been serviced strictly according to the manufacturer schedule.',
  'One owner {model} in very presentable condition inside and out.',
  'This {model} comes from long term ownership and has been looked after properly.'
];

const DETAILS = [
  'Winter and summer wheels are included in the price.',
  'Air conditioning, cruise control and parking sensors are on board.',
  'The interior is free of smoke and shows only light wear on the driver seat.',
  'Timing belt and water pump were replaced during the last major service.',
  'New brake discs and pads were fitted at the most recent inspection.',
  'Navigation, heated seats and a rear view camera are fitted.',
  'The vehicle runs on original wheels with tyres in good condition.',
  'Two keys, the full manual set and all service invoices are handed over.',
  'The battery health was checked recently and is in very good shape.',
  'Bodywork is straight with only minor stone chips on the front bumper.'
];

const CLOSERS = [
  'Viewings are possible on weekdays and by appointment on Saturdays.',
  'A test drive can be arranged at short notice.',
  'Sold with a fresh inspection and a fully documented history.',
  'Trade in of your current vehicle is possible after an on site valuation.',
  'Delivery within northern Germany can be arranged on request.',
  'Private sale, therefore without warranty or right of return.',
  'Financing can be arranged directly through our partner bank.'
];

function esc(value) {
  return String(value).replace(/'/g, "''");
}

function sqlText(value) {
  return value === null || value === undefined ? 'NULL' : `'${esc(value)}'`;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function buildCatalogueIds() {
  const makes = [];
  const models = [];
  const makeId = new Map();
  for (const entry of CATALOG) {
    if (!makeId.has(entry.make)) {
      makeId.set(entry.make, makes.length + 1);
      makes.push({ id: makes.length + 1, name: entry.make });
    }
    const id = models.length + 1;
    models.push({ id, makeId: makeId.get(entry.make), name: entry.model });
    entry.modelId = id;
  }
  return { makes, models };
}

function buildUsers() {
  const users = [];
  users.push({ id: 1, email: 'buyer@demo.de', name: 'Demo Buyer', role: 'BUYER', city: 'Hamburg', phone: null, memberDays: 240 });
  users.push({ id: 2, email: 'seller@demo.de', name: 'Demo Motors Hamburg', role: 'SELLER', city: 'Hamburg', phone: '+49 40 5512 3987', memberDays: 690 });
  users.push({ id: 3, email: 'admin@demo.de', name: 'Demo Admin', role: 'ADMIN', city: 'Hamburg', phone: null, memberDays: 1120 });
  SELLERS.forEach((seller, index) => {
    const local = seller.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]+/g, '.')
      .replace(/^\.|\.$/g, '');
    users.push({
      id: 4 + index,
      email: `${local}@${seller.dealer ? 'autohaus' : 'mail'}.de`,
      name: seller.name,
      role: 'SELLER',
      city: seller.city,
      phone: `+49 ${AREA_CODES[seller.city]} ${randInt(20, 99)}${randInt(10, 99)} ${randInt(10, 99)}${randInt(10, 99)}`,
      memberDays: randInt(200, 1500),
      count: seller.count
    });
  });
  return users;
}

function yearWeight(year) {
  if (year <= 2011) return 3;
  if (year <= 2015) return 7;
  if (year <= 2019) return 12;
  if (year <= 2023) return 11;
  return 6;
}

function pickYear(from) {
  const options = [];
  for (let year = Math.max(from, 2008); year <= 2025; year += 1) {
    options.push([year, yearWeight(year)]);
  }
  return weighted(options);
}

function pickFuel(entry, year) {
  const options = entry.fuels
    .filter(([fuel, w]) => {
      if (w <= 0) return false;
      if (fuel === 'PLUG_IN_HYBRID' && year < 2017) return false;
      if (fuel === 'HYBRID' && year < 2012) return false;
      if (fuel === 'LPG' && year > 2020) return false;
      return true;
    });
  return weighted(options);
}

function pickPower(entry, fuel) {
  const powers = entry.powers;
  let index = randInt(0, powers.length - 1);
  if (fuel === 'PLUG_IN_HYBRID' || fuel === 'ELECTRIC') index = Math.max(index, Math.floor(powers.length / 2));
  if (fuel === 'LPG') index = Math.min(index, 1);
  return { powerKw: powers[index], pct: powers.length === 1 ? 0.5 : index / (powers.length - 1) };
}

function pickTransmission(entry, fuel, powerKw, year) {
  if (fuel === 'ELECTRIC') return 'AUTOMATIC';
  if (fuel === 'PLUG_IN_HYBRID' || fuel === 'HYBRID') return 'AUTOMATIC';
  const premium = ['BMW', 'Mercedes-Benz', 'Audi'].includes(entry.make);
  let p = premium ? 0.62 : 0.24;
  if (powerKw >= 150) p += 0.3;
  p += (year - 2012) * 0.015;
  return chance(Math.min(p, 0.95)) ? 'AUTOMATIC' : 'MANUAL';
}

function badgeFor(entry, fuel, pct) {
  const list = entry.badges[fuel] ?? entry.badges.PETROL;
  const index = Math.min(list.length - 1, Math.floor(pct * list.length));
  return list[index];
}

function buildVehicle(entry) {
  const year = pickYear(entry.from);
  const age = REF_YEAR - year;
  const fuel = pickFuel(entry, year);
  const { powerKw, pct } = pickPower(entry, fuel);
  const body = weighted(entry.bodies);
  const transmission = pickTransmission(entry, fuel, powerKw, year);
  const color = weighted(COLORS);

  const kmPerYear = 8000 + rand() * 12000 * (fuel === 'DIESEL' ? 1.15 : 1) * (fuel === 'ELECTRIC' ? 0.75 : 1);
  const mileage = Math.max(500, Math.round((age * kmPerYear + (rand() - 0.4) * 6000) / 100) * 100);

  const month = randInt(1, 12);
  const firstRegistration = `${year}-${pad(month)}-${pad(randInt(1, 28))}`;

  let nextInspection = null;
  if (!chance(0.06)) {
    const offset = randInt(0, 22);
    const inspectionYear = 2026 + Math.floor((7 + offset) / 12);
    const inspectionMonth = ((7 + offset) % 12) + 1;
    nextInspection = `${inspectionYear}-${pad(inspectionMonth)}-01`;
  }

  const depreciation = Math.max(0.11, Math.pow(0.88, age));
  const expectedMileage = age * 14000;
  const mileageFactor = Math.min(1.12, Math.max(0.82, 1 - (mileage - expectedMileage) / 550000));
  const powerFactor = 0.86 + 0.34 * pct;
  let price = entry.newPrice * depreciation * mileageFactor * powerFactor * (0.94 + rand() * 0.12);
  price = Math.min(entry.price[1], Math.max(entry.price[0], price));
  price = Math.max(690, Math.round(price / 100) * 100 - 10);

  return {
    modelId: entry.modelId,
    body,
    fuel,
    transmission,
    color,
    mileage,
    powerKw,
    doors: pick(DOORS[body]),
    seats: pick(SEATS[body]),
    firstRegistration,
    nextInspection,
    price,
    badge: badgeFor(entry, fuel, pct),
    entry
  };
}

function buildDescription(vehicle, city) {
  const replace = (text) =>
    text
      .replace('{model}', `${vehicle.entry.make} ${vehicle.entry.model}`)
      .replace('{color}', vehicle.color.toLowerCase())
      .replace('{city}', city);
  const parts = [replace(pick(OPENERS)), replace(pick(DETAILS))];
  if (chance(0.7)) parts.push(replace(pick(CLOSERS)));
  return parts.join(' ');
}

function buildTitle(vehicle) {
  const trims = TRIMS[vehicle.entry.make];
  const trim = trims.length > 0 && chance(0.85) ? ` ${pick(trims)}` : '';
  return `${vehicle.entry.make} ${vehicle.entry.model} ${vehicle.badge}${trim}`;
}

function main() {
  const { makes, models } = buildCatalogueIds();
  const users = buildUsers();

  const ownerIds = [];
  users.filter((u) => u.count).forEach((u) => {
    for (let i = 0; i < u.count; i += 1) ownerIds.push(u.id);
  });
  for (let i = 0; i < 8; i += 1) ownerIds.push(2);
  // deterministic Fisher-Yates so the demo seller's listings are spread across the browse pages
  for (let i = ownerIds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [ownerIds[i], ownerIds[j]] = [ownerIds[j], ownerIds[i]];
  }

  const vehicles = [];
  const listings = [];
  const images = [];
  let imageId = 1;

  for (let i = 0; i < LISTING_COUNT; i += 1) {
    const entry = CATALOG[Math.floor(rand() * CATALOG.length)];
    const vehicle = buildVehicle(entry);
    const id = i + 1;
    const sellerId = ownerIds[i];
    const seller = users.find((u) => u.id === sellerId);

    vehicles.push({ id, ...vehicle });
    listings.push({
      id,
      vehicleId: id,
      sellerId,
      title: buildTitle(vehicle),
      description: buildDescription(vehicle, seller.city),
      price: vehicle.price,
      status: 'ACTIVE',
      ageHours: 0
    });

    const shots = chance(0.55) ? 3 : 2;
    for (let n = 0; n < shots; n += 1) {
      images.push({ id: imageId++, listingId: id, url: `/api/images/seed/${id}-${n}.svg`, sortOrder: n });
    }
  }

  const hours = [];
  for (let i = 0; i < LISTING_COUNT; i += 1) {
    hours.push(i < 16 ? randInt(2, 165) : randInt(170, 3000));
  }
  for (let i = hours.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [hours[i], hours[j]] = [hours[j], hours[i]];
  }
  listings.forEach((listing, index) => {
    listing.ageHours = hours[index];
  });

  const flagged = [];
  while (flagged.length < 2) {
    const candidate = listings[randInt(0, LISTING_COUNT - 1)];
    if (candidate.sellerId !== 2 && !flagged.includes(candidate)) flagged.push(candidate);
  }
  flagged.forEach((listing) => {
    listing.status = 'FLAGGED';
  });

  const saved = [];
  while (saved.length < 6) {
    const listing = listings[randInt(0, LISTING_COUNT - 1)];
    if (listing.status === 'ACTIVE' && !saved.some((s) => s.listingId === listing.id)) {
      saved.push({ listingId: listing.id, days: randInt(1, 40) });
    }
  }

  const demoListings = listings.filter((l) => l.sellerId === 2);
  const inquirySenders = [
    ['Nina Albers', 'nina.albers@mail.de', 'Is the vehicle still available and could I see it this Saturday morning?'],
    ['Ralf Timm', 'r.timm@web.de', 'Would you consider an offer slightly below the asking price for a quick sale?'],
    ['Yasemin Kaya', 'yasemin.kaya@mail.de', 'Could you send me the service book photos before I drive over from Kiel?'],
    ['Peter Ohlsen', 'p.ohlsen@gmx.de', 'Has the timing belt already been changed and is there any rust on the sills?'],
    ['Marek Nowak', 'm.nowak@mail.de', 'I am interested in a test drive next week, are weekday evenings possible?'],
    ['Ingrid Sander', 'ingrid.sander@web.de', 'Does the car come with a second set of wheels and how old are the tyres?'],
    ['Tobias Frenzel', 't.frenzel@mail.de', 'Is trade in of a 2014 Golf possible and what would you allow for it?']
  ];
  const inquiries = inquirySenders.map((sender, index) => ({
    id: index + 1,
    listingId: demoListings[index % demoListings.length].id,
    name: sender[0],
    email: sender[1],
    message: sender[2],
    hours: randInt(3, 900)
  }));

  const out = [];
  out.push('-- Generated by scripts/generate-seed.mjs. Do not edit by hand.');
  out.push('-- Flyway runs this migration inside a single transaction.');
  out.push('-- Demo accounts: buyer@demo.de, seller@demo.de, admin@demo.de, password demo1234');
  out.push('');

  out.push('INSERT INTO makes (id, name) VALUES');
  out.push(makes.map((m) => `  (${m.id}, ${sqlText(m.name)})`).join(',\n') + ';');
  out.push('');

  out.push('INSERT INTO models (id, make_id, name) VALUES');
  out.push(models.map((m) => `  (${m.id}, ${m.makeId}, ${sqlText(m.name)})`).join(',\n') + ';');
  out.push('');

  out.push('INSERT INTO users (id, email, password_hash, display_name, role, phone, city, created_at) VALUES');
  out.push(
    users
      .map(
        (u) =>
          `  (${u.id}, ${sqlText(u.email)}, ${sqlText(DEMO_PASSWORD_HASH)}, ${sqlText(u.name)}, ${sqlText(u.role)}, ` +
          `${sqlText(u.phone)}, ${sqlText(u.city)}, now() - interval '${u.memberDays} days')`
      )
      .join(',\n') + ';'
  );
  out.push('');

  out.push(
    'INSERT INTO vehicles (id, model_id, body_type, fuel_type, transmission, color, mileage_km, power_kw, doors, seats, first_registration, next_inspection) VALUES'
  );
  out.push(
    vehicles
      .map(
        (v) =>
          `  (${v.id}, ${v.modelId}, ${sqlText(v.body)}, ${sqlText(v.fuel)}, ${sqlText(v.transmission)}, ${sqlText(v.color)}, ` +
          `${v.mileage}, ${v.powerKw}, ${v.doors}, ${v.seats}, DATE ${sqlText(v.firstRegistration)}, ` +
          `${v.nextInspection ? `DATE ${sqlText(v.nextInspection)}` : 'NULL'})`
      )
      .join(',\n') + ';'
  );
  out.push('');

  out.push('INSERT INTO listings (id, vehicle_id, seller_id, title, description, price_eur, status, created_at, updated_at) VALUES');
  out.push(
    listings
      .map(
        (l) =>
          `  (${l.id}, ${l.vehicleId}, ${l.sellerId}, ${sqlText(l.title)}, ${sqlText(l.description)}, ${l.price}, ` +
          `${sqlText(l.status)}, now() - interval '${l.ageHours} hours', now() - interval '${l.ageHours} hours')`
      )
      .join(',\n') + ';'
  );
  out.push('');

  out.push('INSERT INTO listing_images (id, listing_id, url, sort_order) VALUES');
  out.push(images.map((i) => `  (${i.id}, ${i.listingId}, ${sqlText(i.url)}, ${i.sortOrder})`).join(',\n') + ';');
  out.push('');

  out.push('INSERT INTO saved_listings (user_id, listing_id, created_at) VALUES');
  out.push(saved.map((s) => `  (1, ${s.listingId}, now() - interval '${s.days} days')`).join(',\n') + ';');
  out.push('');

  out.push('INSERT INTO inquiries (id, listing_id, sender_name, sender_email, message, created_at) VALUES');
  out.push(
    inquiries
      .map(
        (i) =>
          `  (${i.id}, ${i.listingId}, ${sqlText(i.name)}, ${sqlText(i.email)}, ${sqlText(i.message)}, ` +
          `now() - interval '${i.hours} hours')`
      )
      .join(',\n') + ';'
  );
  out.push('');

  for (const table of ['makes', 'models', 'users', 'vehicles', 'listings', 'listing_images', 'inquiries']) {
    out.push(`SELECT setval('${table}_id_seq', (SELECT max(id) FROM ${table}));`);
  }
  out.push('');

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out.join('\n'), 'utf8');

  const active = listings.filter((l) => l.status === 'ACTIVE').length;
  process.stdout.write(
    `wrote ${OUT}\n` +
      `makes=${makes.length} models=${models.length} users=${users.length} listings=${listings.length} ` +
      `active=${active} flagged=${listings.length - active} images=${images.length} ` +
      `saved=${saved.length} inquiries=${inquiries.length}\n`
  );
}

main();
