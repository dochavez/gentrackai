import { Dimensions } from 'react-native';

/** Width (dp) at/above which we treat the screen as a tablet/iPad. */
export const IPAD_WIDTH = 768;

const { width } = Dimensions.get('window');

/**
 * Phone-first: sizes use `wp()`/`hp()` from `react-native-responsive-screen`,
 * and on tablets screens use a larger horizontal padding so content stays
 * centered instead of stretching edge-to-edge.
 */
export const IS_TABLET = width >= IPAD_WIDTH;
