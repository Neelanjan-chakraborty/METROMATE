import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { RouteGeometry } from '../../lib/journeyModel';
import { distanceAtProgress } from '../../lib/journeyModel';
import { COLORS, LANDMARKS, SCALE, type LandmarkKind } from './sceneConfig';
import { CityTile, CloudCell, CLOUD_CELL, HopView } from './RouteLayer';
import { hopPrefix, hopShapes, makeWorld, type Pt, type WorldMap } from './routeShapes';
import { LABEL_H, LANDMARK_BOX, LandmarkSprite, labelWidth, STATION_BOX, StationLabel, StationSprite, UndergroundPlatform, type StationState } from './StationSprite';
import { TRAIN_H, TRAIN_W, TrainTop } from './TrainTop';
import { TILE } from './cityDecor';

/**
 * The illustrated live-tracking canvas.
 *
 * Layers (back to front), all moved by one camera that follows the train:
 *   1. city tiles (illustrative fabric)            - world transform
 *   2. cutaway overlay: dark ground + strata        - screen space, fades in underground
 *   3. route, stations, landmarks, train            - world transform
 *   4. clouds (parallax, drift)                     - world transform at 1.25x
 *   5. time-of-day tint                             - screen space
 *
 * The train position is one animated number (distance along the route). Its x/y/heading and the
 * camera are all piecewise-linear interpolations of it, so they run on the native animation thread.
 */

export interface SceneProps {
  geom: RouteGeometry;
  names: string[];
  /** Is this station a place to change trains on this journey? */
  interchange: boolean[];
  /** Soft corridor colour per hop. */
  hopColors: string[];
  /** Fractional station index of the train (the passenger's position). */
  progress: number;
  nextIdx: number | null;
  /** False until a position is known: no train is drawn rather than a made-up one. */
  showTrain: boolean;
  /** The position is an estimate rather than a GPS fix. */
  estimated: boolean;
  /** Show the underground cutaway. */
  underground: boolean;
  width: number;
  height: number;
  /** User zoom factor (1 = default). */
  zoom: number;
  /** Ambient loops (clouds, pulses) run only while true. */
  animate: boolean;
  /** Camera and train tweens; false snaps (reduced motion). */
  smooth: boolean;
  /** 0 day .. 1 night, for the headlights and tint. */
  night: number;
  tint: string;
}

const useNative = Platform.OS !== 'web';
const LEAD_PX = 46; // the camera looks this far ahead of the train
const ANCHOR_Y = 0.56;
const TILE_MARGIN = 230;

export function JourneyScene(p: SceneProps) {
  const { geom, width, height } = p;
  const world = useMemo(() => makeWorld(geom), [geom]);
  const n = geom.stations.length;

  // ----- static per-route data
  const arrays = useMemo(() => {
    const sArr: number[] = [];
    const xArr: number[] = [];
    const yArr: number[] = [];
    const hArr: string[] = [];
    for (const pt of geom.path) {
      const s = pt.s * SCALE;
      if (sArr.length && s <= sArr[sArr.length - 1]) continue;
      const w = world.toWorld(pt.x, pt.y);
      sArr.push(s);
      xArr.push(w.x);
      yArr.push(w.y);
      hArr.push(`${pt.heading.toFixed(2)}deg`);
    }
    return { sArr, xArr, yArr, hArr, total: sArr[sArr.length - 1] };
  }, [geom, world]);
  const routePoly = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < arrays.xArr.length; i++) out.push(arrays.xArr[i], arrays.yArr[i]);
    return out;
  }, [arrays]);
  const stationWorld = useMemo(() => geom.stations.map((s) => world.toWorld(s.x, s.y)), [geom, world]);
  const stationHeading = useMemo(
    () =>
      geom.stations.map((s) => {
        const pt = geom.path.reduce((best, q) => (Math.abs(q.s - s.distM) < Math.abs(best.s - s.distM) ? q : best), geom.path[0]);
        return pt.heading;
      }),
    [geom],
  );
  const hopShapesAll = useMemo(() => geom.hops.map((_, i) => hopShapes(geom, world, i)), [geom, world]);

  // ----- animated values
  const sTargetPx = distanceAtProgress(geom, p.progress) * SCALE;
  const [sv] = useState(() => new Animated.Value(sTargetPx));
  const [zoomAnim] = useState(() => new Animated.Value(p.zoom));
  const [cut] = useState(() => new Animated.Value(p.underground ? 1 : 0));

  const lastTarget = useRef(sTargetPx);
  useEffect(() => {
    const delta = Math.abs(lastTarget.current - sTargetPx);
    lastTarget.current = sTargetPx;
    if (!p.smooth || delta < 0.01) {
      sv.setValue(sTargetPx);
      return;
    }
    const big = delta > 40; // more than ~200 m: ease; small steps follow the GPS cadence linearly
    const anim = Animated.timing(sv, { toValue: sTargetPx, duration: big ? 2200 : 2800, easing: big ? Easing.inOut(Easing.quad) : Easing.linear, useNativeDriver: useNative });
    anim.start();
    return () => anim.stop();
  }, [sTargetPx, p.smooth, sv]);

  useEffect(() => {
    if (!p.smooth) {
      zoomAnim.setValue(p.zoom);
      return;
    }
    const a = Animated.spring(zoomAnim, { toValue: p.zoom, useNativeDriver: useNative, friction: 9, tension: 60 });
    a.start();
    return () => a.stop();
  }, [p.zoom, p.smooth, zoomAnim]);

  useEffect(() => {
    const a = Animated.timing(cut, { toValue: p.underground ? 1 : 0, duration: p.smooth ? 700 : 0, easing: Easing.inOut(Easing.cubic), useNativeDriver: useNative });
    a.start();
    return () => a.stop();
  }, [p.underground, p.smooth, cut]);

  const { sArr, xArr, yArr, hArr, total } = arrays;
  const trainX = useMemo(() => sv.interpolate({ inputRange: sArr, outputRange: xArr, extrapolate: 'clamp' }), [sv, sArr, xArr]);
  const trainY = useMemo(() => sv.interpolate({ inputRange: sArr, outputRange: yArr, extrapolate: 'clamp' }), [sv, sArr, yArr]);
  const trainRot = useMemo(() => sv.interpolate({ inputRange: sArr, outputRange: hArr, extrapolate: 'clamp' }), [sv, sArr, hArr]);
  const camS = useMemo(() => sv.interpolate({ inputRange: [0, total + LEAD_PX], outputRange: [LEAD_PX, total + 2 * LEAD_PX], extrapolate: 'clamp' }), [sv, total]);
  const camX = useMemo(() => camS.interpolate({ inputRange: sArr, outputRange: xArr, extrapolate: 'clamp' }), [camS, sArr, xArr]);
  const camY = useMemo(() => camS.interpolate({ inputRange: sArr, outputRange: yArr, extrapolate: 'clamp' }), [camS, sArr, yArr]);
  const tx = useMemo(() => Animated.subtract(width / 2, Animated.multiply(camX, zoomAnim)), [camX, zoomAnim, width]);
  const ty = useMemo(() => Animated.subtract(height * ANCHOR_Y, Animated.multiply(camY, zoomAnim)), [camY, zoomAnim, height]);
  const cloudTx = useMemo(() => Animated.add(Animated.multiply(Animated.subtract(tx, width / 2), 1.25), width / 2), [tx, width]);
  const cloudTy = useMemo(() => Animated.add(Animated.multiply(Animated.subtract(ty, height * ANCHOR_Y), 1.25), height * ANCHOR_Y), [ty, height]);
  const worldStyle = { transform: [{ translateX: tx }, { translateY: ty }, { scale: zoomAnim }] };
  const cloudStyle = { transform: [{ translateX: cloudTx }, { translateY: cloudTy }, { scale: zoomAnim }] };

  // ----- ambient loops
  const [drift] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!p.animate) {
      drift.setValue(0);
      pulse.setValue(0);
      return;
    }
    const d = Animated.loop(Animated.timing(drift, { toValue: 1, duration: 90_000, easing: Easing.linear, useNativeDriver: useNative }));
    const q = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1900, easing: Easing.out(Easing.quad), useNativeDriver: useNative }));
    d.start();
    q.start();
    return () => {
      d.stop();
      q.stop();
    };
  }, [p.animate, drift, pulse]);
  const driftX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 260] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.7] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] });

  // ----- what is mounted: only the stretch around the train
  const curHop = Math.max(0, Math.min(n - 2, Math.floor(p.progress + 1e-6)));
  const hopFrom = Math.max(0, curHop - 2);
  const hopTo = Math.min(n - 2, curHop + 3);
  const stFrom = Math.max(0, curHop - 1);
  const stTo = Math.min(n - 1, curHop + 4);
  const sMeters = distanceAtProgress(geom, curHop);

  const tiles = useMemo(() => {
    const keys = new Map<string, [number, number]>();
    const s0 = Math.max(0, sMeters * SCALE - 1500 * SCALE * 0.9);
    const s1 = Math.min(total, sMeters * SCALE + 3600 * SCALE);
    for (let i = 0; i < sArr.length; i++) {
      if (sArr[i] < s0 - 60 || sArr[i] > s1 + 60) continue;
      const x0 = Math.floor((xArr[i] - TILE_MARGIN) / TILE);
      const x1 = Math.floor((xArr[i] + TILE_MARGIN) / TILE);
      const y0 = Math.floor((yArr[i] - TILE_MARGIN) / TILE);
      const y1 = Math.floor((yArr[i] + TILE_MARGIN) / TILE);
      for (let a = x0; a <= x1; a++) for (let b = y0; b <= y1; b++) keys.set(`${a}:${b}`, [a, b]);
    }
    return [...keys.values()];
  }, [sMeters, sArr, xArr, yArr, total]);

  const clouds = useMemo(() => {
    const cx = Math.floor((world.toWorld(geom.stations[curHop].x, geom.stations[curHop].y).x * 1.25) / CLOUD_CELL);
    const cy = Math.floor((world.toWorld(geom.stations[curHop].x, geom.stations[curHop].y).y * 1.25) / CLOUD_CELL);
    const out: [number, number][] = [];
    for (let a = cx - 1; a <= cx + 1; a++) for (let b = cy - 1; b <= cy + 1; b++) out.push([a, b]);
    return out;
  }, [world, geom, curHop]);

  // ----- station states
  const stateOf = (i: number): StationState => {
    if (i < Math.floor(p.progress + 1e-6)) return 'done';
    if (Math.abs(p.progress - i) < 0.02) return 'current';
    if (i === p.nextIdx) return 'next';
    return 'upcoming';
  };
  const doneHopFraction = (i: number) => (i < curHop ? 1 : i === curHop ? Math.round(Math.max(0, Math.min(1, p.progress - curHop)) * 24) / 24 : 0);

  const stationNodes = [];
  for (let i = stFrom; i <= stTo; i++) {
    const w = stationWorld[i];
    const st = geom.stations[i];
    const state = stateOf(i);
    const heading = stationHeading[i];
    const vertical = Math.abs(Math.sin((heading * Math.PI) / 180)) < 0.7;
    const lm = LANDMARKS[st.id] as LandmarkKind | undefined;
    const lw = labelWidth(p.names[i]);
    stationNodes.push(
      <View key={st.id + i} pointerEvents="none" style={StyleSheet.absoluteFill}>
        {lm ? (
          <View style={{ position: 'absolute', left: w.x - LANDMARK_BOX / 2 + (vertical ? -62 : 0), top: w.y - LANDMARK_BOX / 2 + (vertical ? 0 : -60) }}>
            <LandmarkSprite kind={lm} />
          </View>
        ) : null}
        {st.underground ? (
          <Animated.View style={{ position: 'absolute', left: w.x - STATION_BOX / 2, top: w.y - STATION_BOX / 2, opacity: cut }}>
            <UndergroundPlatform heading={heading} />
          </Animated.View>
        ) : null}
        <View style={{ position: 'absolute', left: w.x - STATION_BOX / 2, top: w.y - STATION_BOX / 2 }}>
          <StationSprite heading={heading} underground={st.underground} interchange={p.interchange[i]} state={state} isOrigin={i === 0} isDestination={i === n - 1} color={p.hopColors[Math.min(i, n - 2)]} />
        </View>
        <View style={{ position: 'absolute', left: vertical ? w.x + 26 : w.x - lw / 2, top: vertical ? w.y - LABEL_H / 2 : w.y + 30 }}>
          <StationLabel name={p.names[i]} state={state} />
        </View>
      </View>,
    );
  }

  const nextW = p.nextIdx !== null ? stationWorld[p.nextIdx] : null;
  const beam = Math.max(p.night, p.underground ? 1 : 0);
  const cutOpacity = cut.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] });
  const cloudOpacity = cut.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const strataShift = Animated.multiply(Animated.subtract(ty, height * ANCHOR_Y), 0.6);

  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: COLORS.ground }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* 1. city fabric */}
      <Animated.View pointerEvents="none" style={[styles.world, worldStyle]}>
        {tiles.map(([a, b]) => (
          <CityTile key={`${a}:${b}`} tx={a} ty={b} route={routePoly} />
        ))}
      </Animated.View>

      {/* 2. underground cutaway: dark ground with strata */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: cutOpacity }]}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="cut-bg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1B1D52" />
              <Stop offset="1" stopColor="#0C0D2C" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} fill="url(#cut-bg)" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: strataShift }] }]}>
          <Svg width={width} height={height * 1.6} viewBox={`0 0 ${width} ${height * 1.6}`}>
            {Array.from({ length: 14 }, (_, i) => (
              <Path key={i} d={`M0 ${40 + i * 72} Q${width * 0.3} ${20 + i * 72 + (i % 3) * 14} ${width * 0.6} ${44 + i * 72} T${width} ${30 + i * 72}`} stroke="#5A5FC0" strokeOpacity={0.12 + (i % 3) * 0.04} strokeWidth={2 + (i % 2)} fill="none" />
            ))}
            {Array.from({ length: 22 }, (_, i) => (
              <Circle key={`d${i}`} cx={(i * 97) % width} cy={(i * 131) % (height * 1.6)} r={1.6 + (i % 3)} fill="#6A6FD8" opacity={0.14} />
            ))}
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* 3. route, stations, train */}
      <Animated.View pointerEvents="none" style={[styles.world, worldStyle]}>
        {Array.from({ length: hopTo - hopFrom + 1 }, (_, k) => hopFrom + k).map((i) => {
          const done = doneHopFraction(i);
          return <HopView key={i} hop={hopShapesAll[i]} color={p.hopColors[i]} cut={cut} done={done} donePts={done > 0 ? hopPrefix(geom, world, i, done) : EMPTY} />;
        })}
        {stationNodes}
        {nextW && p.animate ? (
          <Animated.View style={{ position: 'absolute', left: nextW.x - 34, top: nextW.y - 34, width: 68, height: 68, opacity: ringOpacity, transform: [{ scale: ringScale }] }}>
            <Svg width={68} height={68} viewBox="-34 -34 68 68">
              <Circle cx={0} cy={0} r={30} fill="none" stroke={COLORS.progress} strokeWidth={2.4} />
            </Svg>
          </Animated.View>
        ) : null}
        {p.showTrain ? (
        <Animated.View
          style={{
            position: 'absolute',
            left: -TRAIN_W / 2,
            top: -TRAIN_H / 2,
            width: TRAIN_W,
            height: TRAIN_H,
            transform: [{ translateX: trainX }, { translateY: trainY }, { rotate: trainRot }],
          }}
        >
          <View style={{ position: 'absolute', left: -34, top: -14, width: TRAIN_W + 68, height: TRAIN_H + 28 }}>
            <Svg width={TRAIN_W + 68} height={TRAIN_H + 28} viewBox={`${-(TRAIN_W + 68) / 2} ${-(TRAIN_H + 28) / 2} ${TRAIN_W + 68} ${TRAIN_H + 28}`}>
              <Defs>
                <RadialGradient id="train-glow" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
                  <Stop offset="0" stopColor={p.estimated ? '#FFFFFF' : COLORS.progressGlow} stopOpacity={p.estimated ? 0.1 : 0.4} />
                  <Stop offset="1" stopColor={COLORS.progressGlow} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <G>
                <Rect x={-(TRAIN_W + 68) / 2} y={-(TRAIN_H + 28) / 2} width={TRAIN_W + 68} height={TRAIN_H + 28} rx={50} fill="url(#train-glow)" />
              </G>
            </Svg>
          </View>
          <TrainTop beam={beam} estimated={p.estimated} />
        </Animated.View>
        ) : null}
      </Animated.View>

      {/* 4. clouds */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: cloudOpacity }]}>
        <Animated.View style={[styles.world, cloudStyle]}>
          <Animated.View style={{ transform: [{ translateX: driftX }] }}>
            {clouds.map(([a, b]) => (
              <CloudCell key={`${a}:${b}`} cx={a} cy={b} />
            ))}
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* 5. time-of-day tint */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: p.tint, opacity: Math.min(0.5, p.night * 0.5) }]} />
    </View>
  );
}

const EMPTY: Pt[] = [];

const styles = StyleSheet.create({
  world: { position: 'absolute', left: 0, top: 0, width: 0, height: 0 },
});

export type { WorldMap };
