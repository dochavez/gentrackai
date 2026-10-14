import Svg, { Circle, Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

/** Viewfinder corners with a lens — the "scan a generator" mark. */
export function ScanIcon({ size = 26, color = Palette.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={2} />
    </Svg>
  );
}
