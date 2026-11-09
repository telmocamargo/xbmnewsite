import * as migration_20261107_042524_initial from './20261107_042524_initial';
import * as migration_20261107_132147_pages_and_messages from './20261107_132147_pages_and_messages';
import * as migration_20261109_201118_search_text from './20261109_201118_search_text';

export const migrations = [
  {
    up: migration_20261107_042524_initial.up,
    down: migration_20261107_042524_initial.down,
    name: '20261107_042524_initial',
  },
  {
    up: migration_20261107_132147_pages_and_messages.up,
    down: migration_20261107_132147_pages_and_messages.down,
    name: '20261107_132147_pages_and_messages',
  },
  {
    up: migration_20261109_201118_search_text.up,
    down: migration_20261109_201118_search_text.down,
    name: '20261109_201118_search_text'
  },
];
