import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

export function InsightsIcon({ size = 23, color = Palette.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20V10M10 20V4M16 20v-7M22 20H2"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
