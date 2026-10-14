import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

export function BoltIcon({ size = 27, color = Palette.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill={color} />
    </Svg>
  );
}
