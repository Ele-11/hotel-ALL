import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ENV_FILE_PATH = resolve(process.cwd(), '.env');

export function loadEnvFile() {
  if (!existsSync(ENV_FILE_PATH)) {
    return;
  }

  const file = readFileSync(ENV_FILE_PATH, 'utf8');

  for (const rawLine of file.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    const rawValue = line.slice(separatorIndex + 1).trim();
    process.env[key] = stripQuotes(rawValue);
  }
}

function stripQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
