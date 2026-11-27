export const DEFAULT_SETTINGS = {
  name: 'Regal Music',
  tagline: 'Rule the Rhythm',
  phones: '9090410530, 7683826267, 7064226368',
  address: 'Karada, Angeipal, Dhamnagar, Bhadrak, 756117',
  services: ['Sharpy', 'CO₂', 'Paper Spray', 'S. Show', 'Cold Fire'],
  segments: ['DJ', 'Sound System', 'Lighting', 'Band', 'Tent & Decor'],
  roles: ['DJ Operator', 'Light Operator', 'Sound Engineer', 'Helper', 'Driver', 'Manager'],
  invCategories: ['Speakers', 'Amplifiers & mixers', 'Lights', 'Effects machines', 'Cables & stands', 'Consumables', 'Vehicle & generator', 'Other'],
  rulesTitle: 'ନିୟମାବଳୀ',
  rules: [
    'ପ୍ରୋଗ୍ରାମ ସରିବା ମାତ୍ରେ ସମ୍ପୂର୍ଣ୍ଣ ପଇସା ପୈଠ କରିବେ ।',
    'ପ୍ରସେସନ ସମୟରେ ଯଦି କୌଣସି ଗଣ୍ଡଗୋଳ କରି ଡିଜେର କୌଣସି କ୍ଷତି କରନ୍ତି ତେବେ ପ୍ରୋଗ୍ରାମ ବୁକିଙ୍ଗ କରିଥିବା ବ୍ୟକ୍ତି କ୍ଷତି ପୂରଣ ବାବଦରେ ସମସ୍ତ ଟଙ୍କା ବହନ କରିବେ ।',
    'ଆଡଭାନ୍ସ ଦେବା ପରେ ବୁକିଂ ବାତିଲ କଲେ ଆଡଭାନ୍ସ ଟଙ୍କା ଫେରସ୍ତ ଦିଆଯିବ ନାହିଁ ।',
    'ଦିନରେ ବିବାହ କିମ୍ବା ଶୋଭାଯାତ୍ରା ଅପରାହ୍ନ ୩ ଘଟିକା ଏବଂ ରାତ୍ରୀରେ ବିବାହ କିମ୍ବା ଶୋଭାଯାତ୍ରା ୧୦ ଘଟିକା ସମୟରେ ସମାପ୍ତ କରିବେ ।',
    'ଦୈବ ଦୁର୍ଘଟଣା ପାଇଁ Regal Music ଦାୟୀ ରହିବେ ନାହିଁ ।',
    'ଥାନା ବିନା ପର୍ମିଶନ୍ Regal Music ପୂଜା ପାର୍ବଣ କିମ୍ବା ବିବାହ ପ୍ରୋସେସନ୍ କରିପାରିବେ ନାହିଁ ।',
    'ପ୍ରୋଗ୍ରାମ ସରିବା ପରେ ଟଙ୍କା ନ ଦେଲେ କିମ୍ବା କୌଣସି ଝାମେଲା କଲେ ଆମ୍ଭେ ସଂଘ ମାଧ୍ୟମରେ ଆପଣଙ୍କ ବିରୋଧରେ ଆଇନ୍ ଆଶ୍ରୟ ନେବୁ ।',
  ],
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

export const PAYTYPES = ['Per event', 'Per day', 'Per month', 'Per hour'];
export const MODES = ['Cash', 'UPI', 'Bank transfer'];
export const EVENTS = ['Wedding', 'Barat procession', 'Puja / Bhasani', 'Birthday', 'Party', 'Other'];

// Data the app starts with the first time it opens.
export const SEED = {
  employees: [],
  ledger: [],
  projects: [],
};
