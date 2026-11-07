import * as migration_20261107_042524_initial from './20261107_042524_initial';

export const migrations = [
  {
    up: migration_20261107_042524_initial.up,
    down: migration_20261107_042524_initial.down,
    name: '20261107_042524_initial'
  },
];
