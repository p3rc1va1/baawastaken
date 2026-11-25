import { describe, expect, test } from 'vitest';
import { emptySnapshot, parseSnapshot, serializeSnapshot, type Snapshot } from '../src/lib/youtube/snapshot.ts';

const hash = 'a'.repeat(64);
const good: Snapshot = {
  version: 1,
  channelId: 'UC-x',
  latest: 'aaaaaaaaaaa',
  videos: { aaaaaaaaaaa: { title: 'T', published: '2026-01-01T00:00:00.000Z', thumbSha256: hash } },
};

describe('snapshot', () => {
  test('serialises byte-for-byte the same regardless of key order', () => {
    const shuffled = {
      videos: { aaaaaaaaaaa: { thumbSha256: hash, published: '2026-01-01T00:00:00.000Z', title: 'T' } },
      latest: 'aaaaaaaaaaa',
      channelId: 'UC-x',
      version: 1,
    } as Snapshot;
    expect(serializeSnapshot(shuffled)).toBe(serializeSnapshot(good));
    expect(serializeSnapshot(good).endsWith('}\n')).toBe(true);
    expect(Object.keys(JSON.parse(serializeSnapshot(good)))).toEqual(['channelId', 'latest', 'version', 'videos']);
  });

  test('round-trips', () => {
    expect(parseSnapshot(serializeSnapshot(good))).toEqual(good);
    expect(parseSnapshot(serializeSnapshot(emptySnapshot('UC-x')))).toEqual(emptySnapshot('UC-x'));
  });

  test.each([
    ['not json', /not valid JSON/],
    ['[]', /expected an object/],
    [JSON.stringify({ ...good, version: 2 }), /unsupported version 2/],
    [JSON.stringify({ ...good, channelId: '' }), /channelId/],
    [JSON.stringify({ ...good, videos: [] }), /videos must be an object/],
    [JSON.stringify({ ...good, videos: { short: good.videos['aaaaaaaaaaa'] } }), /not a video ID/],
    [JSON.stringify({ ...good, videos: { aaaaaaaaaaa: { title: 'T', published: 'nope', thumbSha256: hash } } }), /published/],
    [JSON.stringify({ ...good, videos: { aaaaaaaaaaa: { title: 'T', published: '2026-01-01T00:00:00Z', thumbSha256: 'xyz' } } }), /thumbSha256/],
    [JSON.stringify({ ...good, latest: 'bbbbbbbbbbb' }), /not in videos/],
  ])('rejects %s with a clear message', (input, message) => {
    expect(() => parseSnapshot(input)).toThrow(message);
  });
});
