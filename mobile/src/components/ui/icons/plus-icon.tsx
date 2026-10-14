import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

export function PlusIcon({ size = 22, color = Palette.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}
