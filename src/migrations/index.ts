import * as migration_20261107_042524_initial from './20261107_042524_initial';
import * as migration_20261107_132147_pages_and_messages from './20261107_132147_pages_and_messages';

export const migrations = [
  {
    up: migration_20261107_042524_initial.up,
    down: migration_20261107_042524_initial.down,
    name: '20261107_042524_initial',
  },
  {
    up: migration_20261107_132147_pages_and_messages.up,
    down: migration_20261107_132147_pages_and_messages.down,
    name: '20261107_132147_pages_and_messages'
  },
];
