import Svg, { Path, Rect } from 'react-native-svg';

import { Palette } from '@/constants/design';

export function CalendarIcon({ size = 19, color = Palette.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4.5} width={18} height={16} rx={2.5} stroke={color} strokeWidth={1.9} />
      <Path d="M3 9h18M8 2.5v4M16 2.5v4" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M8.5 14l2 2 4-4" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
