import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

/** Document with lines — used for reports / PDF affordances. */
export function ReportIcon({ size = 18, color = Palette.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M14 3v5h5" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 13h6M9 17h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
