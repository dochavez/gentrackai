import { View } from 'react-native';
import { useMarkdown, type MarkedStyles, type useMarkdownHookOptions } from 'react-native-marked';

import { Font, Palette } from '@/constants/design';

/**
 * Renders an assistant reply's markdown (bold, italic, headings, lists, code)
 * via react-native-marked, themed from the design tokens. The `useMarkdown`
 * hook returns plain nodes, so it composes safely inside the chat ScrollView.
 */

const markedStyles: MarkedStyles = {
  text: { fontFamily: Font.regular, fontSize: 14.5, lineHeight: 21, color: Palette.ink },
  paragraph: { marginTop: 0, marginBottom: 0, paddingVertical: 3 },
  strong: { fontFamily: Font.bold, color: Palette.ink },
  em: { fontStyle: 'italic' },
  link: { fontFamily: Font.semibold, color: Palette.goldText },
  li: { fontFamily: Font.regular, fontSize: 14.5, lineHeight: 21, color: Palette.ink },
  list: { paddingVertical: 2 },
  h1: { fontFamily: Font.bold, fontSize: 17, lineHeight: 23, color: Palette.ink, marginTop: 6, marginBottom: 2 },
  h2: { fontFamily: Font.bold, fontSize: 16, lineHeight: 22, color: Palette.ink, marginTop: 6, marginBottom: 2 },
  h3: { fontFamily: Font.bold, fontSize: 15, lineHeight: 21, color: Palette.ink, marginTop: 4, marginBottom: 2 },
  codespan: { fontFamily: 'monospace', fontSize: 13, color: Palette.ink },
};

const options: useMarkdownHookOptions = {
  colorScheme: 'light',
  theme: {
    colors: {
      text: Palette.ink,
      link: Palette.goldText,
      code: 'rgba(27,23,18,0.06)',
      border: Palette.hairline,
    },
    spacing: { xs: 2, s: 4, m: 8, l: 12 },
  },
  styles: markedStyles,
};

export function MarkdownMessage({ content }: { content: string }) {
  const elements = useMarkdown(content, options);

  return <View>{elements}</View>;
}
