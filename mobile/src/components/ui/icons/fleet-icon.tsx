import Svg, { Path, Rect } from 'react-native-svg';

import { Palette } from '@/constants/design';

/** Generator unit — the "Fleet" tab icon. */
export function FleetIcon({ size = 23, color = Palette.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={2.5} y={7} width={19} height={11} rx={2.5} stroke={color} strokeWidth={1.9} />
      <Path
        d="M11 10l-1.5 3H13l-1.5 3"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
