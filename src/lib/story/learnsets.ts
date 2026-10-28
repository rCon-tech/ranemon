/**
 * The 6 sport moves each Ranemon line learns in story mode, in the order it learns them, at
 * the levels in SPORT_LEVELS. Picked for the type (each line gets a strong attack of its own
 * type) and for the person. Evolved forms learn their line's moves.
 */
export const LEARNSETS: Record<string, string[]> = {
  carlmon: ['fore', 'scrum-down', 'drs', 'top-bins', 'rage-quit', 'lights-out'],
  steadmon: ['tiki-taka', 'golf-clap', 'bandeja', 'putt-for-dough', 'lag-switch', 'drop-goal'],
  enda: ['nutmeg', 'top-bins', 'the-dive', 'fields-of-athenry', 'one-more-game', 'hole-in-one'],
  oismon: ['fore', 'padel-bore', 'drs', 'slipstream', 'por-tres', 'lights-out'],
  olliemon: [
    'fend-off',
    'park-the-bus',
    'fields-of-athenry',
    'scrum-down',
    'drive-for-show',
    'bicycle-kick',
  ],
  hugomon: ['undercut', 'speedrun', 'lag-switch', 'team-orders', 'vibora', 'rage-quit'],
  gibbsmon: [
    'fend-off',
    'park-the-bus',
    'combo-breaker',
    'scrum-down',
    'top-bins',
    'drive-for-show',
  ],
  jammon: ['bandeja', 'globo', 'respawn', 'combo-breaker', 'one-more-game', 'slipstream'],
  boydemon: ['fend-off', 'nutmeg', 'speedrun', 'combo-breaker', 'garryowen', 'bicycle-kick'],
  killemon: ['fore', 'the-dive', 'globo', 'drs', 'top-bins', 'por-tres'],
  lorcamon: [
    'the-dive',
    'mulligan',
    'padel-bore',
    'putt-for-dough',
    'one-more-game',
    'hole-in-one',
  ],
  owemon: ['fore', 'park-the-bus', 'scrum-down', 'drs', 'lights-out', 'bicycle-kick'],
  conemon: ['fore', 'pit-stop', 'fields-of-athenry', 'top-bins', 'one-more-game', 'por-tres'],
  robinmon: [
    'the-dive',
    'respawn',
    'lag-switch',
    'fields-of-athenry',
    'one-more-game',
    'hole-in-one',
  ],
  simomon: ['sin-bin', 'mulligan', 'off-the-glass', 'bandeja', 'respawn', 'slipstream'],
  thilomon: ['nutmeg', 'speedrun', 'garryowen', 'vibora', 'combo-breaker', 'rage-quit'],
  paulimon: ['fore', 'tiki-taka', 'drs', 'putt-for-dough', 'top-bins', 'lights-out'],
  skehemon: ['sin-bin', 'nutmeg', 'globo', 'vibora', 'rage-quit', 'slipstream'],
  crampemon: ['fore', 'nutmeg', 'drs', 'speedrun', 'lights-out', 'rage-quit'],
  nickamon: ['the-dive', 'mulligan', 'nutmeg', 'globo', 'one-more-game', 'hole-in-one'],
  vinnimon: [
    'the-dive',
    'golf-clap',
    'fields-of-athenry',
    'drop-goal',
    'one-more-game',
    'hole-in-one',
  ],
  // London's lines (docs/london-ranedex.md), with polo, Sunday League and synchronised swimming.
  oystermon: ['on-for-five', 'two-footed', 'mud-bath', 'deep-end', 'hoof-it', 'slipstream'],
  speedmon: ['fore', 'ride-off', 'nose-clip', 'drs', 'top-bins', 'scrum-down'],
  pedalmon: ['fend-off', 'drs', 'pit-stop', 'slipstream', 'lights-out', 'bicycle-kick'],
  skatemon: ['nutmeg', 'eggbeater', 'speedrun', 'garryowen', 'top-bins', 'rage-quit'],
  fleamon: ['near-side', 'orange-slices', 'sequins', 'two-footed', 'hoof-it', 'boost-lift'],
  oatmon: ['deep-end', 'royal-box', 'treading-in', 'perfect-ten', 'chukka', 'slipstream'],
  seedmon: ['undercut', 'lag-switch', 'team-orders', 'putt-for-dough', 'drop-goal', 'por-tres'],
  decksmon: ['fore', 'bandeja', 'globo', 'perfect-ten', 'lights-out', 'slipstream'],
  jabmon: ['fend-off', 'combo-breaker', 'mud-bath', 'scrum-down', 'hoof-it', 'drive-for-show'],
  bagelmon: ['pimms', 'the-dive', 'bandeja', 'perfect-ten', 'one-more-game', 'hole-in-one'],
  bunchmon: ['near-side', 'orange-slices', 'pimms', 'the-dive', 'hoof-it', 'one-more-game'],
  wickmon: ['nutmeg', 'ref-you-blind', 'speedrun', 'garryowen', 'vibora', 'rage-quit'],
  aerodactivist: ['undercut', 'off-the-glass', 'golf-clap', 'vibora', 'drop-goal', 'rage-quit'],
};

export const SPORT_LEVELS = [8, 16, 25, 33, 42, 50];

/** A Ranemon knows 4 moves at once; the rest it has learnt wait to be swapped in. */
export const MOVE_SLOTS = 4;
