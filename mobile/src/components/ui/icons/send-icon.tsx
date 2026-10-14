import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

/** Navigation-arrow send glyph. */
export function SendIcon({ size = 20, color = Palette.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 3L10.5 13.5M21 3l-6.5 18-4-8-8-4L21 3z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
