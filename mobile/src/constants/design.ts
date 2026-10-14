/**
 * GenTrack design tokens — derived from the product design in `/design`.
 *
 * The product uses a warm cream + gold/amber theme with dark-brown ink. This is
 * distinct from the Expo-starter blue still used by the demo tabs; screens built
 * to the real design should pull colors, fonts, and radii from here.
 */

export const Palette = {
  // Brand
  gold: '#FFC531',
  goldTop: '#FFCF33', // gradient start (header)
  goldSoft: '#FFE199',
  goldWash: '#FFF0D6',
  goldTint: '#FFFBEF',
  goldText: '#B08A15', // gold-toned text / links on light

  // Ink & surfaces
  ink: '#1B1712',
  cream: '#F7F2E8', // app background
  white: '#FFFFFF',

  // Text
  textMuted: '#8A8270',
  textSubtle: '#6B6452',
  textStrong: '#5B5544',
  textFaint: '#948C79',
  onGoldSubtitle: '#5B4E1E', // subtitle sitting on the gold header
  placeholder: '#B8B0A0',

  // Lines
  border: 'rgba(27,23,18,0.12)',
  hairline: 'rgba(27,23,18,0.10)',

  // Status
  green: '#1FA463',
  greenBg: '#E6F6EC',
  greenBorder: '#BEE6CD',
  greenText: '#1B5E3A',
  red: '#C7402B',
  redBg: '#FDE7E2',
  alert: '#E5533C',

  // Surfaces / misc
  cardBorder: 'rgba(27,23,18,0.05)',
  planBg: '#FFF3D1',
  planText: '#7A6A2E',
  tabInactive: '#B4AC98',
  scanBg: '#141210', // dark scan/camera surface
} as const;

export const Radius = {
  input: 14,
  button: 16,
  logo: 18,
} as const;

/** Layout tokens. Screen padding uses `wp()` + `IS_TABLET` (see `@/constants/dimensions`). */
export const Layout = {
  /** Max width for the floating tab bar on wide screens. */
  maxContentWidth: 640,
} as const;

/**
 * Font family names. These match the keys registered via `useFonts` in
 * `src/hooks/use-app-fonts.ts`.
 */
export const Font = {
  displayBold: 'BricolageGrotesque_700Bold',
  displayExtra: 'BricolageGrotesque_800ExtraBold',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;
