export const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark' | 'system'
  // Business details are blank until filled in under Settings → Business details.
  name: '',
  tagline: '',
  phones: '',
  address: '',
  services: ['Sharpy', 'CO₂', 'Paper Spray', 'S. Show', 'Cold Fire'],
  segments: ['DJ', 'Sound System', 'Lighting', 'Band', 'Tent & Decor'],
  roles: ['DJ Operator', 'Light Operator', 'Sound Engineer', 'Helper', 'Driver', 'Manager'],
  invCategories: [
    'Bass', 'Line array', 'Top speakers', 'Monitors', 'Amplifiers', 'Mixers & DJ decks', 'Mics',
    'Cords & cables', 'Stands & trusses', 'Lights', 'Effects machines', 'Generator & power', 'Vehicle', 'Consumables', 'Other',
  ],
  expenseCategories: ['Diesel / fuel', 'Transport / vehicle', 'Food', 'Gear rent', 'Repair', 'Shop rent', 'Electricity', 'Phone & internet', 'Loan / EMI', 'Other'],
  rulesTitle: '',
  rules: [],
};

export const STATUSES = {
  booked: { label: 'Booked', tone: 'plum' },
  done: { label: 'Programme done', tone: 'warn' },
  final: { label: 'Billed', tone: 'good' },
  cancel: { label: 'Cancelled', tone: 'bad' },
};

export const ITEM_KINDS = [['equipment', 'Equipment'], ['consumable', 'Consumable']];
export const UNITS = ['pcs', 'set', 'pair', 'box', 'bottle', 'cylinder', 'kg', 'litre', 'metre'];
export const MOVE_TYPES = {
  in: { label: 'Stock in', tone: 'good' },
  out: { label: 'Used / out', tone: 'warn' },
  repair: { label: 'Sent for repair', tone: 'bad' },
  fixed: { label: 'Back from repair', tone: 'plum' },
  adjust: { label: 'Count corrected', tone: 'plum' },
};

// Extra details asked for each kind of DJ gear. Stored on the item as `specs`.
export const SPEC_FIELDS = {
  size: { label: 'Driver size (inch)', suffix: '"', keyboard: 'decimal-pad', placeholder: '18' },
  drivers: { label: 'Drivers per box', suffix: ' drivers', keyboard: 'number-pad', placeholder: '2' },
  watts: { label: 'Power (watts)', suffix: 'W', keyboard: 'number-pad', placeholder: '2000' },
  powered: { label: 'Active / passive', choices: ['Active (powered)', 'Passive'] },
  channels: { label: 'Channels', suffix: ' ch', keyboard: 'number-pad', placeholder: '4' },
  cordType: { label: 'Cord type', choices: ['Speakon', 'XLR', 'Power', 'Extension board', 'Jack 6.35 mm', 'RCA', 'DMX', 'Multicore'] },
  length: { label: 'Length (metre)', suffix: ' m', keyboard: 'decimal-pad', placeholder: '20' },
  kva: { label: 'Capacity (kVA)', suffix: ' kVA', keyboard: 'decimal-pad', placeholder: '15' },
  fuel: { label: 'Fuel', choices: ['Diesel', 'Petrol'] },
};

// Which details to ask for, worked out from the category name so renamed categories still match.
export function specKeysFor(category) {
  const c = String(category || '').toLowerCase();
  if (/bass|sub|woofer/.test(c)) return ['size', 'drivers', 'watts', 'powered'];
  if (/line|linary|array/.test(c)) return ['size', 'drivers', 'watts', 'powered'];
  if (/top|speaker|monitor|box/.test(c)) return ['size', 'watts', 'powered'];
  if (/amp/.test(c)) return ['watts', 'channels'];
  if (/mixer|deck|console|controller/.test(c)) return ['channels'];
  if (/cord|cable|wire/.test(c)) return ['cordType', 'length'];
  if (/generator|power|genset/.test(c)) return ['kva', 'fuel'];
  if (/light/.test(c)) return ['watts'];
  return [];
}

// Short text like `18" · 2 drivers · 2000W` for lists.
export function specSummary(it) {
  const s = it.specs || {};
  return specKeysFor(it.category)
    .filter((k) => s[k] !== undefined && String(s[k]).trim() !== '')
    .map((k) => String(s[k]).trim() + (SPEC_FIELDS[k].suffix || ''))
    .join(' · ');
}

// One-tap starting points on the Add item form.
export const ITEM_PRESETS = [
  { name: 'Bass 18" double', category: 'Bass', unit: 'pcs', specs: { size: '18', drivers: '2' } },
  { name: 'Bass 18" single', category: 'Bass', unit: 'pcs', specs: { size: '18', drivers: '1' } },
  { name: 'Line array 10" double', category: 'Line array', unit: 'pcs', specs: { size: '10', drivers: '2' } },
  { name: 'Line array 12"', category: 'Line array', unit: 'pcs', specs: { size: '12', drivers: '1' } },
  { name: 'Top 15"', category: 'Top speakers', unit: 'pcs', specs: { size: '15' } },
  { name: 'Top 12"', category: 'Top speakers', unit: 'pcs', specs: { size: '12' } },
  { name: 'Monitor 12"', category: 'Monitors', unit: 'pcs', specs: { size: '12' } },
  { name: 'Amplifier', category: 'Amplifiers', unit: 'pcs', specs: { channels: '2' } },
  { name: 'Crossover / DSP', category: 'Amplifiers', unit: 'pcs', specs: {} },
  { name: 'DJ mixer', category: 'Mixers & DJ decks', unit: 'pcs', specs: { channels: '4' } },
  { name: 'DJ controller', category: 'Mixers & DJ decks', unit: 'pcs', specs: {} },
  { name: 'Wireless mic', category: 'Mics', unit: 'set', specs: {} },
  { name: 'Speakon cord', category: 'Cords & cables', unit: 'pcs', specs: { cordType: 'Speakon', length: '20' } },
  { name: 'XLR cord', category: 'Cords & cables', unit: 'pcs', specs: { cordType: 'XLR', length: '10' } },
  { name: 'Power cord', category: 'Cords & cables', unit: 'pcs', specs: { cordType: 'Power', length: '30' } },
  { name: 'Extension board', category: 'Cords & cables', unit: 'pcs', specs: { cordType: 'Extension board' } },
  { name: 'Speaker stand', category: 'Stands & trusses', unit: 'pcs', specs: {} },
  { name: 'Truss', category: 'Stands & trusses', unit: 'pcs', specs: {} },
  { name: 'Sharpy beam light', category: 'Lights', unit: 'pcs', specs: { watts: '230' } },
  { name: 'Par light', category: 'Lights', unit: 'pcs', specs: {} },
  { name: 'CO₂ jet machine', category: 'Effects machines', unit: 'pcs', specs: {} },
  { name: 'Cold fire machine', category: 'Effects machines', unit: 'pcs', specs: {} },
  { name: 'Generator', category: 'Generator & power', unit: 'pcs', specs: { fuel: 'Diesel' } },
  { name: 'CO₂ cylinder', category: 'Consumables', unit: 'cylinder', kind: 'consumable', specs: {} },
  { name: 'Cold fire powder', category: 'Consumables', unit: 'kg', kind: 'consumable', specs: {} },
  { name: 'Paper spray', category: 'Consumables', unit: 'box', kind: 'consumable', specs: {} },
];

export const PAYTYPES =['Per event', 'Per day', 'Per month', 'Per hour'];
export const MODES = ['Cash', 'UPI', 'Bank transfer'];
export const EVENTS = ['Wedding', 'Barat procession', 'Puja / Bhasani', 'Birthday', 'Party', 'Other'];

// Data the app starts with the first time it opens.
export const SEED = {
  employees: [],
  ledger: [],
  projects: [],
};
