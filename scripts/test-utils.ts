import assert from 'node:assert/strict';

export function at<T>(list: readonly T[], index: number): T {
  const value = list.at(index);
  assert.ok(
    value !== undefined,
    `expected an element at index ${index} of a list of ${list.length}`,
  );
  return value;
}

export function get<T>(record: Readonly<Record<string, T>>, key: string): T {
  const value = record[key];
  assert.ok(value !== undefined, `expected a value under ${JSON.stringify(key)}`);
  return value;
}
