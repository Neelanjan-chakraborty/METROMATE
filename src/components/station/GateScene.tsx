import React, { memo } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { mixColor } from '../../lib/skyPalette';
import type { GateFeatures } from '../../lib/stationView';

/*
 * An illustration of one entry/exit gate. It is deliberately generic: GMRC publishes gate NUMBERS, the
 * lifts (with ramp) near each gate, and the station type, and nothing about which street a gate faces or
 * where stairs and escalators are. So the scene always shows the same entrance at street level, with:
 *   - the gate number on the sign (from GMRC's gate table),
 *   - a glass lift tower with a wheelchair-ramp badge ONLY when GMRC lists a lift near this gate,
 *   - a covered link with a dashed outline ONLY when the unofficial map names a connection at this gate
 *     (unverified, so it is dashed and tagged "?"),
 *   - the viaduct and a train above (elevated) or a sunken entrance (underground), from the station type.
 */

interface Props {
  gate: GateFeatures;
  underground: boolean;
  lineColor: string;
  /** 0 (day) .. 1 (night), from the time-of-day sky. */
  night: number;
}

export const GateScene = memo(function GateScene({ gate, underground, lineColor, night }: Props) {
  const sky1 = mixColor('#C9E0F7', '#1B1B55', night);
  const sky2 = mixColor('#EEF5FC', '#3A3A86', night);
  const tower = mixColor('#E4E8F5', '#46468F', night * 0.8);
  const road = mixColor('#8C94AD', '#2C2C63', night * 0.85);
  const walk = mixColor('#DCE3F0', '#4A4A92', night * 0.85);
  const grass = mixColor('#B7D4A0', '#27456B', night * 0.85);
  const deck = mixColor('#D6D2EE', '#4A4A92', night * 0.8);
  const glass = mixColor('#BFD9F0', '#6E78C8', night * 0.6);
  const font = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;
  const hasLift = gate.lifts.length > 0;
  const link = gate.connections[0] ?? null;
  const hx = hasLift ? 118 : 140; // entrance hall x

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Illustration of Gate ${gate.number}${hasLift ? ` with lift ${gate.lifts.map((l) => String(l).padStart(2, '0')).join(' and ')}` : ''}. Not the real layout.`}>
      <Svg width="100%" height={undefined} viewBox="0 0 360 200" style={{ aspectRatio: 360 / 200 }}>
        <Defs>
          <LinearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky1} />
            <Stop offset="1" stopColor={sky2} />
          </LinearGradient>
        </Defs>
        <Rect width={360} height={200} fill="url(#gs-sky)" />
        {/* distant blocks */}
        <G fill={mixColor('#C3D3EA', '#2E2E7A', night * 0.8)} opacity={0.7}>
          <Rect x={8} y={60} width={26} height={90} />
          <Rect x={40} y={80} width={20} height={70} />
          <Rect x={300} y={56} width={24} height={94} />
          <Rect x={328} y={84} width={26} height={66} />
        </G>

        {underground ? null : (
          <G>
            {/* viaduct with a train */}
            {[34, 128, 232, 326].map((x) => (
              <Rect key={x} x={x - 5} y={54} width={10} height={100} rx={2} fill={deck} />
            ))}
            <Rect x={0} y={44} width={360} height={11} fill={deck} />
            <Rect x={0} y={53} width={360} height={3} fill={lineColor} opacity={0.85} />
            <G transform="translate(168 20)">
              <Rect width={178} height={24} rx={8} fill="#FFFFFF" stroke="#D9DFEF" />
              <Rect x={4} y={5} width={170} height={8} rx={2.5} fill="#3D5FC7" />
              {Array.from({ length: 9 }, (_, i) => (
                <Rect key={i} x={9 + i * 18} y={6.5} width={11} height={5} rx={1.5} fill="#BFD6F5" />
              ))}
              <Rect y={17} width={178} height={2.6} fill="#4F35E8" />
              <Path d="M158 0 H170 Q178 0 178 8 V18 Q178 24 170 24 H158 Z" fill="#2C3E86" />
            </G>
          </G>
        )}

        {/* street */}
        <Rect y={150} width={360} height={14} fill={walk} />
        <Rect y={164} width={360} height={36} fill={road} />
        <Path d="M0 182H360" stroke="#FFFFFF" strokeWidth={1.6} strokeDasharray="14 12" opacity={0.7} />
        <Rect y={149} width={360} height={2} fill={mixColor('#B8C2D8', '#5B5BA8', night)} />
        <G>
          <Rect x={8} y={140} width={2.4} height={12} fill="#7A6A55" />
          <Circle cx={9} cy={136} r={9} fill={grass} />
          <Rect x={338} y={140} width={2.4} height={12} fill="#7A6A55" />
          <Circle cx={339} cy={136} r={9} fill={grass} />
        </G>

        {underground ? (
          <G>
            {/* sunken stair entrance */}
            <Rect x={hx - 6} y={112} width={92} height={40} fill={tower} />
            <Path d={`M${hx + 6} 152 L${hx + 22} 126 H${hx + 62} L${hx + 78} 152 Z`} fill={mixColor('#454E68', '#15153F', night * 0.6)} />
            {[0, 1, 2, 3].map((i) => (
              <Path key={i} d={`M${hx + 24 + i * 11} 152 L${hx + 28 + i * 9} 127`} stroke="#8993AC" strokeWidth={1.2} />
            ))}
            <Path d={`M${hx - 14} 112 L${hx - 4} 100 H${hx + 90} L${hx + 100} 112 Z`} fill={lineColor} />
          </G>
        ) : (
          <G>
            {/* entrance hall under the viaduct, with a canopy and glass door */}
            <Rect x={hx} y={92} width={84} height={58} fill={tower} />
            <Rect x={hx + 10} y={106} width={64} height={44} fill={glass} />
            {[0, 1, 2].map((i) => (
              <Rect key={i} x={hx + 10 + i * 21.3} y={106} width={1.2} height={44} fill="#FFFFFF" opacity={0.8} />
            ))}
            <Rect x={hx + 33} y={120} width={18} height={30} fill={mixColor('#6C7690', '#1B1B55', night * 0.5)} />
            <Path d={`M${hx - 8} 94 L${hx} 84 H${hx + 84} L${hx + 92} 94 Z`} fill={lineColor} />
            <Rect x={hx - 8} y={93} width={100} height={2} fill="#FFFFFF" opacity={0.7} />
          </G>
        )}

        {/* the gate sign: number from GMRC's gate table */}
        <G transform={`translate(${hx + 42} ${underground ? 76 : 70})`}>
          <Rect x={-30} y={-13} width={60} height={24} rx={8} fill="#FFD84A" stroke="#E5B800" strokeWidth={1} />
          <SvgText x={0} y={4.5} fontSize={13} fontWeight="800" fill="#3B2E00" textAnchor="middle" fontFamily={font}>
            {`Gate ${gate.number}`}
          </SvgText>
          <Rect x={-1.2} y={11} width={2.4} height={underground ? 22 : 3} fill="#9A8420" />
        </G>

        {/* lift tower with a wheelchair-ramp badge (only when GMRC lists a lift near this gate) */}
        {hasLift ? (
          <G transform={`translate(${hx + 112} 0)`}>
            <Rect x={0} y={underground ? 108 : 66} width={34} height={underground ? 44 : 86} rx={4} fill={tower} />
            <Rect x={4} y={underground ? 112 : 78} width={26} height={underground ? 36 : 68} rx={2.5} fill={glass} />
            <Rect x={9} y={underground ? 124 : 112} width={16} height={22} rx={2} fill="#6A55F0" opacity={0.9} />
            <Rect x={-2} y={underground ? 104 : 62} width={38} height={5} rx={2.5} fill="#A79FE6" />
            <G transform={`translate(17 ${underground ? 128 : 116})`}>
              <Path d="M0 -5 V3 M-3.5 -2 L0 -4.5 L3.5 -2" stroke="#FFFFFF" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </G>
            <G transform={`translate(17 ${underground ? 95 : 82})`}>
              <Circle r={10} fill="#0F6FC4" stroke="#FFFFFF" strokeWidth={2} />
              <Circle cx={0} cy={-4.4} r={1.5} fill="#FFFFFF" />
              <Path d="M-1 -2 V1.5 H3.2 L4.8 5 M-1 0 H2.6 M-3.8 1.4 A4 4 0 1 0 1.4 6" stroke="#FFFFFF" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </G>
          </G>
        ) : null}

        {/* unofficial-map connection at this gate: a dashed covered link and a tag, flagged unverified */}
        {link ? (
          <G>
            <Rect x={14} y={108} width={Math.max(40, hx - 24)} height={20} rx={8} fill="#FFFFFF" opacity={0.55} stroke="#6A55F0" strokeWidth={1.6} strokeDasharray="5 4" />
            <Circle cx={30} cy={118} r={8} fill="#6A55F0" />
            <Path d={link.kind === 'rail' ? 'M26 121 H34 M27 113 H33 V120 H27 Z' : 'M26 121 H34 M26.5 114 H33.5 V120 H26.5 Z'} stroke="#FFFFFF" strokeWidth={1.3} fill="none" strokeLinejoin="round" />
            <SvgText x={44} y={122} fontSize={9.5} fontWeight="700" fill="#4F35E8" fontFamily={font}>
              {`${link.kind === 'brts' ? 'BRTS' : link.kind === 'rail' ? 'Rail' : 'Bus'} link ?`}
            </SvgText>
          </G>
        ) : null}
      </Svg>
    </View>
  );
});
