import React, { memo, useMemo } from 'react';
import { Platform, Pressable, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { AGENCY_LOOK } from '../../lib/transit/format';
import { lodFor, pathD, type BusMapGeometry, type LegEnd, type LegLine, type MetroLayer } from '../../lib/transit/geoMap';
import { AGENCY_IDS, type AgencyId } from '../../lib/transit/types';
import { colors } from '../../theme';
import { bus } from '../../theme/bus';

/*
 * Geographic Bus & metro map. No base tiles offline, so it is lines and dots on a plain ground colour with a
 * faint grid. Each bus layer is ONE Path (not hundreds of elements); the zoom only changes stroke widths and
 * which pre-built level of detail is used. Taps are resolved in JS from the touch point (see map.tsx).
 */

const FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;
const GROUND = '#F4F1EC';
const GRID = '#E6E1D8';
const WALK = '#6B7280';

export interface BusMapProps {
  geo: BusMapGeometry;
  metro: MetroLayer;
  layers: Record<AgencyId, boolean>;
  /** Route index selected on the map, or null. */
  selectedRoute: number | null;
  /** Journey to highlight (from a planned trip), or null. */
  journey: { lines: LegLine[]; ends: LegEnd[] } | null;
  scale: number;
  /** A stop picked from a stop tap, drawn as a ring. */
  pickedStop: { x: number; y: number } | null;
  corridorColor: (id: string) => string;
  onTap: (x: number, y: number) => void;
}

/** Zoom-independent on-screen pixel size to map units. */
const px = (n: number, scale: number) => n / scale;

function tapPoint(e: GestureResponderEvent, scale: number): { x: number; y: number } | null {
  const ne = e.nativeEvent as unknown as { locationX?: number; locationY?: number; clientX?: number; clientY?: number };
  if (Platform.OS === 'web') {
    const el = (e.currentTarget as unknown as { getBoundingClientRect?: () => { left: number; top: number } }) ?? null;
    const r = el?.getBoundingClientRect?.();
    if (r && ne.clientX !== undefined && ne.clientY !== undefined) return { x: (ne.clientX - r.left) / scale, y: (ne.clientY - r.top) / scale };
  }
  if (ne.locationX === undefined || ne.locationY === undefined) return null;
  return { x: ne.locationX / scale, y: ne.locationY / scale };
}

function BusMapImpl({ geo, metro, layers, selectedRoute, journey, scale, pickedStop, corridorColor, onTap }: BusMapProps) {
  const { width: W, height: H } = geo.proj;
  const minSep = lodFor(scale);
  const focus = selectedRoute !== null || journey !== null;
  const dim = focus ? 0.22 : 1;

  const layerPaths = useMemo(() => AGENCY_IDS.map((a) => ({ agency: a, ...geo.layer(a, minSep) })), [geo, minSep]);
  const route = useMemo(() => (selectedRoute === null ? null : geo.route(selectedRoute, minSep)), [geo, selectedRoute, minSep]);
  const routeAgency = useMemo(() => (selectedRoute === null ? null : geo.drawables.find((d) => d.route === selectedRoute)?.agency ?? null), [geo, selectedRoute]);

  const grid = useMemo(() => {
    // one grid line per 5 km of ground
    const step = 5000 / geo.proj.metresPerUnit;
    const v: number[] = [];
    const h: number[] = [];
    for (let x = step; x < W; x += step) v.push(x);
    for (let y = step; y < H; y += step) h.push(y);
    return { v, h, step };
  }, [geo, W, H]);

  const lineW = (n: number) => px(n, scale);
  const barUnits = 10000 / geo.proj.metresPerUnit;

  return (
    <Pressable
      accessibilityRole="image"
      accessibilityLabel="Map of bus routes and the metro around Ahmedabad and Gandhinagar. Tap a line or a stop for details."
      onPress={(e) => {
        const p = tapPoint(e, scale);
        if (p) onTap(p.x, p.y);
      }}
      style={{ width: W * scale, height: H * scale }}
    >
      <Svg width={W * scale} height={H * scale} viewBox={`0 0 ${W} ${H}`} pointerEvents="none">
        <Rect width={W} height={H} fill={GROUND} />
        {grid.v.map((x) => (
          <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} stroke={GRID} strokeWidth={lineW(1)} />
        ))}
        {grid.h.map((y) => (
          <Line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} stroke={GRID} strokeWidth={lineW(1)} />
        ))}

        {/* all bus lines: road shape solid, straight-between-stops dashed */}
        {layerPaths.map((l) =>
          layers[l.agency] ? (
            <G key={l.agency} opacity={dim}>
              {l.solid ? <Path d={l.solid} stroke={AGENCY_LOOK[l.agency].color} strokeWidth={lineW(l.agency === 'AJL' ? 2.4 : 1.4)} strokeOpacity={l.agency === 'AMTS' ? 0.7 : 0.95} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
              {l.dashed ? <Path d={l.dashed} stroke={AGENCY_LOOK[l.agency].color} strokeWidth={lineW(1.4)} strokeOpacity={0.85} strokeDasharray={`${lineW(5)} ${lineW(4)}`} fill="none" strokeLinejoin="round" /> : null}
            </G>
          ) : null,
        )}

        {/* metro lines through the (estimated) station pins */}
        <G opacity={focus ? 0.5 : 1}>
          {metro.lines.map((l) => (
            <G key={l.id}>
              <Path d={l.d} stroke="#FFFFFF" strokeWidth={lineW(7)} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Path d={l.d} stroke={corridorColor(l.id)} strokeWidth={lineW(4)} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            </G>
          ))}
          {metro.stations.map((s) => (
            <Circle key={s.id} cx={s.x} cy={s.y} r={px(s.interchange ? 4.6 : 3.2, scale)} fill="#FFFFFF" stroke={s.interchange ? colors.interchange : corridorColor(s.corridor)} strokeWidth={lineW(s.interchange ? 2.6 : 2)} />
          ))}
        </G>

        {/* selected route */}
        {route && routeAgency ? (
          <G>
            {route.solid ? <Path d={route.solid} stroke="#FFFFFF" strokeWidth={lineW(7)} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
            {route.dashed ? <Path d={route.dashed} stroke="#FFFFFF" strokeWidth={lineW(7)} fill="none" strokeLinejoin="round" /> : null}
            {route.solid ? <Path d={route.solid} stroke={bus.red} strokeWidth={lineW(4)} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
            {route.dashed ? <Path d={route.dashed} stroke={bus.red} strokeWidth={lineW(3.4)} strokeDasharray={`${lineW(8)} ${lineW(5)}`} fill="none" strokeLinejoin="round" /> : null}
            {route.stops.map((s) => (
              <Circle key={s.stop} cx={s.x} cy={s.y} r={px(s.terminal ? 5.2 : 2.8, scale)} fill={s.terminal ? bus.red : '#FFFFFF'} stroke={bus.dark} strokeWidth={lineW(1.4)} />
            ))}
            {route.stops
              .filter((s) => s.terminal)
              .map((s) => (
                <Label key={`t${s.stop}`} x={s.x + px(8, scale)} y={s.y - px(7, scale)} size={px(12, scale)} halo={lineW(3)} weight="800" fill={bus.dark} text={s.name} />
              ))}
          </G>
        ) : null}

        {/* journey */}
        {journey ? (
          <G>
            {journey.lines.map((l, i) => (
              <Path key={`jh${i}`} d={pathD(l.xy)} stroke="#FFFFFF" strokeWidth={lineW(l.mode === 'walk' ? 5 : 9)} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {journey.lines.map((l, i) => (
              <Path
                key={`j${i}`}
                d={pathD(l.xy)}
                stroke={l.mode === 'walk' ? WALK : l.mode === 'metro' ? corridorColor(l.corridorId ?? '') : AGENCY_LOOK[l.agency ?? 'AJL'].color}
                strokeWidth={lineW(l.mode === 'walk' ? 3 : 5.5)}
                strokeDasharray={l.mode === 'walk' ? `${lineW(2)} ${lineW(5)}` : l.straight && l.mode === 'bus' ? `${lineW(9)} ${lineW(5)}` : undefined}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {journey.ends.map((e, i) => (
              <G key={`e${i}`}>
                <Circle cx={e.x} cy={e.y} r={px(e.kind === 'change' ? 5 : 9, scale)} fill={e.kind === 'origin' ? colors.origin : e.kind === 'destination' ? colors.destination : '#FFFFFF'} stroke={e.kind === 'change' ? bus.dark : '#FFFFFF'} strokeWidth={lineW(e.kind === 'change' ? 2.4 : 3)} />
                {e.kind !== 'change' ? (
                  <SvgText x={e.x} y={e.y + px(4, scale)} fontFamily={FONT} fontSize={px(11, scale)} fontWeight="800" fill="#FFFFFF" textAnchor="middle">
                    {e.kind === 'origin' ? 'A' : 'B'}
                  </SvgText>
                ) : null}
              </G>
            ))}
          </G>
        ) : null}

        {pickedStop ? <Circle cx={pickedStop.x} cy={pickedStop.y} r={px(9, scale)} fill="none" stroke={bus.dark} strokeWidth={lineW(2.5)} /> : null}

        {/* metro names: terminals and interchanges always, the rest when zoomed in */}
        {metro.stations
          .filter((s) => s.terminal || s.interchange || scale >= 1.6)
          .map((s) => (
            <Label key={`n${s.id}`} x={s.x + px(7, scale)} y={s.y + px(4, scale)} size={px(10.5, scale)} halo={lineW(3)} weight={s.interchange ? '800' : '600'} fill="#2B2F55" text={s.name} />
          ))}

        {/* scale bar */}
        <G>
          <Rect x={px(12, scale)} y={H - px(26, scale)} width={barUnits} height={lineW(3)} fill="#4B5563" />
          <SvgText x={px(12, scale)} y={H - px(32, scale)} fontFamily={FONT} fontSize={px(10.5, scale)} fontWeight="700" fill="#4B5563">
            10 km
          </SvgText>
        </G>
      </Svg>
    </Pressable>
  );
}

/** Text with a white outline so it stays readable over lines (react-native-svg has no paint-order). */
function Label({ x, y, size, halo, weight, fill, text }: { x: number; y: number; size: number; halo: number; weight: '600' | '800'; fill: string; text: string }) {
  return (
    <G>
      <SvgText x={x} y={y} fontFamily={FONT} fontSize={size} fontWeight={weight} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={halo} strokeLinejoin="round">
        {text}
      </SvgText>
      <SvgText x={x} y={y} fontFamily={FONT} fontSize={size} fontWeight={weight} fill={fill}>
        {text}
      </SvgText>
    </G>
  );
}

export const BusMap = memo(BusMapImpl);
