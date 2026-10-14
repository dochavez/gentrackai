import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Palette } from '@/constants/design';

export function ImageIcon({ size = 24, color = Palette.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2.5} stroke={color} strokeWidth={1.7} />
      <Circle cx={8.5} cy={10} r={1.6} fill={color} />
      <Path
        d="M4 17l4.5-4 3 2.5L16 11l4 4.5"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
