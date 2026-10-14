import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

export function ChatIcon({ size = 26, color = Palette.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 11.5a8 8 0 01-11.4 7.2L4 20l1.3-4.2A8 8 0 1120 11.5z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Path
        d="M11.2 8.2l.8-1.9.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"
        fill={color}
      />
    </Svg>
  );
}
