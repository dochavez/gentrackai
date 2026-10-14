import Svg, { Circle, Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

/** Two people — used for team / organization affordances. */
export function UsersIcon({ size = 20, color = Palette.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={8} r={3.2} stroke={color} strokeWidth={1.8} />
      <Path
        d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14c2.3.4 4 2.4 4 5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
