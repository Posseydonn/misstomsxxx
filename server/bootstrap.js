import * as postgres from './services/postgres.js';

let initializationPromise;

export function ensureServerReady() {
  if (!initializationPromise) {
    initializationPromise = Promise.resolve(postgres.initDb?.()).then(() => undefined);
  }

  return initializationPromise;
}
