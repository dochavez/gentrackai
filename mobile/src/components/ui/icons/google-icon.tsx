import Svg, { Path } from 'react-native-svg';

/** Google's multicolor "G" mark. */
export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-4.9 3.4-8.4z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 21.4 7.5 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.4-.4-2.8s.2-2.1.4-2.8V6.3H1.8C1 7.7.5 9.8.5 12s.5 4.3 1.3 5.7l3.8-2.9z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.7 2.6 1.8 6.3l3.8 2.9C6.5 6.5 9 4.8 12 4.8z"
      />
    </Svg>
  );
}
