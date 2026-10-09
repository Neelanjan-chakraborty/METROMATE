import React, { memo, useMemo } from 'react';
import { Animated, Platform, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { COLORS } from './sceneConfig';
import { nearbyPolyline, TILE, tileShapes, type Shape } from './cityDecor';
import { polyD, samplesAlong, type HopShapes, type Pt } from './routeShapes';

const raster = Platform.OS === 'android' ? { renderToHardwareTextureAndroid: true } : Platform.OS === 'ios' ? { shouldRasterizeIOS: true } : {};

// --------------------------------------------------------------------- tiles

/** One tile of illustrative city fabric. Static: drawn once, then moved by the camera. */
export const CityTile = memo(function CityTile({ tx, ty, route }: { tx: number; ty: number; route: number[] }) {
  const shapes = useMemo(() => tileShapes(tx, ty, nearbyPolyline(route, tx, ty, 90)), [tx, ty, route]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: tx * TILE, top: ty * TILE, width: TILE, height: TILE }} {...raster}>
      <Svg width={TILE} height={TILE} viewBox={`0 0 ${TILE} ${TILE}`}>
        {shapes.map((s, i) => (
          <ShapeEl key={i} s={s} />
        ))}
      </Svg>
    </View>
  );
});

function ShapeEl({ s }: { s: Shape }) {
  if (s.k === 'rect') return <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={s.fill} opacity={s.opacity} />;
  if (s.k === 'circle') return <Circle cx={s.x} cy={s.y} r={s.r} fill={s.fill} opacity={s.opacity} />;
  if (s.k === 'poly') return <Path d={`M${s.pts!.split(' ').join(' L')} Z`} fill={s.fill} opacity={s.opacity} />;
  return <Path d={`M${s.pts!.split(' ').join(' L')}`} stroke={s.stroke} strokeWidth={s.sw} opacity={s.opacity} fill="none" strokeLinecap="butt" />;
}

// ---------------------------------------------------------------------- hops

interface HopProps {
  hop: HopShapes;
  /** Soft colour of the corridor this hop belongs to. */
  color: string;
  /** Animated 0 (surface) .. 1 (underground cutaway). */
  cut: Animated.Value;
  /** 0..1 of this hop already travelled (quantised by the caller). */
  done: number;
  donePts: Pt[];
}

const ox = (h: HopShapes) => h.bbox.x;
const oy = (h: HopShapes) => h.bbox.y;

/** Base drawing of a hop: viaduct (or ghosted tunnel), lit tunnel for the cutaway, completed glow. */
export const HopView = memo(function HopView({ hop, color, cut, done, donePts }: HopProps) {
  const { bbox } = hop;
  const hasTunnel = hop.tunnel.length > 0;
  const hasElevated = hop.elevated.length > 0;
  const dimSurface = hasElevated ? cut.interpolate({ inputRange: [0, 1], outputRange: [1, 0.22] }) : 1;
  const frame = { position: 'absolute' as const, left: bbox.x, top: bbox.y, width: bbox.w, height: bbox.h };
  const pillars = useMemo(() => hop.elevated.flatMap((p) => samplesAlong(p, 34)), [hop]);
  const lights = useMemo(() => hop.tunnel.flatMap((p) => samplesAlong(p, 14)), [hop]);
  // Portal mouth: where an underground stretch meets an elevated one (placed at mid-hop; the real spot is unknown).
  const portal = useMemo(() => {
    if (!hop.tunnel.length || !hop.elevated.length) return null;
    const t = hop.tunnel[0];
    const e = hop.elevated[0];
    const tEnd = t[t.length - 1];
    const eStart = e[0];
    return Math.hypot(tEnd.x - eStart.x, tEnd.y - eStart.y) < 1 ? tEnd : t[0];
  }, [hop]);
  const dX = ox(hop);
  const dY = oy(hop);
  const dd = (p: Pt[], x = 0, y = 0) => polyD(p, dX - x, dY - y);
  return (
    <>
      <Animated.View pointerEvents="none" style={[frame, { opacity: dimSurface }]} {...raster}>
        <Svg width={bbox.w} height={bbox.h}>
          {hop.elevated.map((p, i) => (
            <G key={`e${i}`}>
              <Path d={dd(p, -5, -7)} stroke={COLORS.deckShadow} strokeOpacity={0.22} strokeWidth={9} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Path d={dd(p)} stroke={COLORS.deckEdge} strokeWidth={10.4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Path d={dd(p)} stroke={COLORS.deck} strokeWidth={7.6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Path d={dd(p)} stroke={color} strokeOpacity={0.5} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Path d={dd(p)} stroke="#DADCF0" strokeWidth={7} strokeDasharray="0.8 3.2" fill="none" />
            </G>
          ))}
          {pillars.map((q, i) => (
            <G key={`p${i}`}>
              <Circle cx={q.x - dX + 3.5} cy={q.y - dY + 5} r={2.6} fill={COLORS.deckShadow} opacity={0.3} />
              <Circle cx={q.x - dX} cy={q.y - dY} r={2.2} fill="#B6BAD9" />
            </G>
          ))}
          {portal ? (
            <G>
              <Circle cx={portal.x - dX} cy={portal.y - dY} r={7.5} fill={COLORS.tunnelDark} opacity={0.28} />
              <Circle cx={portal.x - dX} cy={portal.y - dY} r={5} fill={COLORS.tunnelDark} />
              <Circle cx={portal.x - dX} cy={portal.y - dY} r={3} fill={COLORS.tunnelLit} opacity={0.9} />
            </G>
          ) : null}
          {hop.tunnel.map((p, i) => (
            <Path key={`g${i}`} d={dd(p)} stroke="#8A8FBE" strokeWidth={4.6} strokeOpacity={0.75} strokeDasharray="4 3.2" fill="none" strokeLinejoin="round" />
          ))}
        </Svg>
      </Animated.View>

      {hasTunnel ? (
        <Animated.View pointerEvents="none" style={[frame, { opacity: cut }]} {...raster}>
          <Svg width={bbox.w} height={bbox.h}>
            {hop.tunnel.map((p, i) => (
              <G key={`t${i}`}>
                <Path d={dd(p)} stroke={COLORS.tunnelDark} strokeWidth={15} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <Path d={dd(p)} stroke="#2A2D78" strokeWidth={10} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <Path d={dd(p)} stroke="#3D41A0" strokeWidth={6.4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <Path d={dd(p)} stroke={COLORS.tunnelLit} strokeWidth={1.8} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              </G>
            ))}
            {lights.map((q, i) => (
              <G key={`l${i}`}>
                <Circle cx={q.x - dX} cy={q.y - dY} r={2.8} fill="#BDB6FF" opacity={0.18} />
                <Circle cx={q.x - dX} cy={q.y - dY} r={1} fill="#E7E3FF" />
              </G>
            ))}
          </Svg>
        </Animated.View>
      ) : null}

      {done > 0 && donePts.length > 1 ? (
        <Animated.View pointerEvents="none" style={[frame, { opacity: hasTunnel ? 1 : dimSurface }]} {...raster}>
          <Svg width={bbox.w} height={bbox.h}>
            <Path d={dd(donePts)} stroke={COLORS.progressGlow} strokeOpacity={0.3} strokeWidth={13} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <Path d={dd(donePts)} stroke={COLORS.progress} strokeWidth={5.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <Path d={dd(donePts)} stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={1.3} strokeDasharray="3 5" fill="none" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      ) : null}
    </>
  );
});

// -------------------------------------------------------------------- clouds

const CLOUD_CELL = 560;

function cloudSpec(cx: number, cy: number) {
  const h = (Math.imul(cx + 311, 73856093) ^ Math.imul(cy + 997, 19349663)) >>> 0;
  const r = (n: number) => ((h >>> n) & 255) / 255;
  return { x: r(0) * (CLOUD_CELL - 220), y: r(8) * (CLOUD_CELL - 120), s: 0.7 + r(16) * 0.7, n: Math.floor(r(24) * 3) };
}

/** Soft clouds drifting above the city. They are above the route, never over the train's own icon. */
export const CloudCell = memo(function CloudCell({ cx, cy }: { cx: number; cy: number }) {
  const c = cloudSpec(cx, cy);
  if (c.n === 0) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: cx * CLOUD_CELL + c.x, top: cy * CLOUD_CELL + c.y, width: 220 * c.s, height: 110 * c.s }}>
      <Svg width={220 * c.s} height={110 * c.s} viewBox="0 0 220 110">
        <Ellipse cx={116} cy={74} rx={90} ry={22} fill="#7C82B8" opacity={0.1} />
        <G opacity={0.55} fill="#FFFFFF">
          <Ellipse cx={78} cy={46} rx={46} ry={22} />
          <Ellipse cx={122} cy={38} rx={42} ry={24} />
          <Ellipse cx={156} cy={52} rx={38} ry={18} />
          <Ellipse cx={104} cy={56} rx={62} ry={16} />
        </G>
      </Svg>
    </View>
  );
});
export { CLOUD_CELL };
