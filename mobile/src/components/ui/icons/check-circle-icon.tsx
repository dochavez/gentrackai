import Svg, { Circle, Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

/** Filled circle with a white check — used for success states. */
export function CheckCircleIcon({ size = 18, color = Palette.green }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={11} fill={color} />
      <Path
        d="M7 12.5l3.2 3.2L17 8.5"
        stroke="#fff"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
