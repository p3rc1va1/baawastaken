import { afterEach, describe, expect, test, vi } from 'vitest';
import { getLatestVideo } from '../src/lib/latest-video';
import { emptySnapshot, type Snapshot } from '../src/lib/youtube/snapshot.ts';

afterEach(() => vi.restoreAllMocks());

const withVideo: Snapshot = {
  version: 1,
  channelId: 'UC-x',
  latest: 'aaaaaaaaaaa',
  videos: { aaaaaaaaaaa: { title: 'Hello', published: '2026-11-01T00:00:00.000Z', thumbSha256: 'a'.repeat(64) } },
};

describe('getLatestVideo (committed snapshot)', () => {
  test('returns the snapshot video, and never touches the network', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(getLatestVideo(withVideo)).toEqual({ id: 'aaaaaaaaaaa', title: 'Hello', published: '2026-11-01T00:00:00.000Z' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('null when the snapshot names no video', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(getLatestVideo(emptySnapshot('UC-x'))).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('reads the real committed snapshot by default', () => {
    const video = getLatestVideo();
    expect(video === null || /^[\w-]{11}$/.test(video.id)).toBe(true);
  });
});
