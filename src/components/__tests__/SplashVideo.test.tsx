import React from 'react';
import { act, create } from 'react-test-renderer';
import { SPLASH_SECONDS, SplashVideo } from '../SplashVideo';

type Handler = (payload?: unknown) => void;
const mockHandlers: Record<string, Handler> = {};
const mockPlayer = { loop: true, muted: false, timeUpdateEventInterval: 0, play: jest.fn(), pause: jest.fn() };
const mockHideAsync = jest.fn(() => Promise.resolve());
let mockSetup: ((p: typeof mockPlayer) => void) | undefined;

jest.mock('expo', () => ({
  useEventListener: (_p: unknown, name: string, fn: Handler) => {
    mockHandlers[name] = fn;
  },
}));
jest.mock('expo-video', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    useVideoPlayer: (_source: unknown, s: (p: typeof mockPlayer) => void) => {
      mockSetup = s;
      s(mockPlayer);
      return mockPlayer;
    },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    VideoView: (props: object) => require('react').createElement(View, { testID: 'video', ...props }),
  };
});
jest.mock('expo-splash-screen', () => ({ hideAsync: () => mockHideAsync(), preventAutoHideAsync: jest.fn() }));

function mount(onDone: () => void) {
  act(() => {
    create(<SplashVideo onDone={onDone} />);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  for (const k of Object.keys(mockHandlers)) delete mockHandlers[k];
  mockPlayer.pause.mockClear();
  mockPlayer.play.mockClear();
  mockHideAsync.mockClear();
});
afterEach(() => jest.useRealTimers());

describe('SplashVideo', () => {
  it('plays muted, once, from the start', () => {
    mount(() => undefined);
    expect(mockSetup).toBeDefined();
    expect(mockPlayer.loop).toBe(false);
    expect(mockPlayer.muted).toBe(true);
    expect(mockPlayer.play).toHaveBeenCalled();
    expect(mockPlayer.timeUpdateEventInterval).toBeLessThanOrEqual(0.25);
  });

  it('plays exactly the first 6 seconds, then hands over to the app', () => {
    const done = jest.fn();
    mount(done);
    expect(SPLASH_SECONDS).toBe(6);
    act(() => mockHandlers.timeUpdate({ currentTime: 3.2 }));
    act(() => mockHandlers.timeUpdate({ currentTime: 5.9 }));
    act(() => jest.advanceTimersByTime(1000));
    expect(done).not.toHaveBeenCalled();
    expect(mockPlayer.pause).not.toHaveBeenCalled();

    act(() => mockHandlers.timeUpdate({ currentTime: 6.0 }));
    expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(600)); // fade out
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('only finishes once however many end signals arrive', () => {
    const done = jest.fn();
    mount(done);
    act(() => {
      mockHandlers.timeUpdate({ currentTime: 6.1 });
      mockHandlers.timeUpdate({ currentTime: 6.2 });
      mockHandlers.playToEnd();
    });
    act(() => jest.advanceTimersByTime(1000));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('a playback error never blocks the app', () => {
    const done = jest.fn();
    mount(done);
    act(() => mockHandlers.statusChange({ status: 'error' }));
    act(() => jest.advanceTimersByTime(600));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('a video that never starts is abandoned shortly after the planned length', () => {
    const done = jest.fn();
    mount(done);
    act(() => jest.advanceTimersByTime(SPLASH_SECONDS * 1000 + 2000));
    expect(done).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1200));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('releases the native splash once it is done', () => {
    mount(() => undefined);
    act(() => mockHandlers.timeUpdate({ currentTime: 6 }));
    expect(mockHideAsync).toHaveBeenCalled();
  });
});
