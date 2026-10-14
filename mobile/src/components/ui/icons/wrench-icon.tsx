import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

export function WrenchIcon({ size = 22, color = Palette.goldText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a4 4 0 00-5.4 5.4l-6 6 2 2 6-6a4 4 0 005.4-5.4l-2.6 2.6-2-2 2.6-2.6z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
