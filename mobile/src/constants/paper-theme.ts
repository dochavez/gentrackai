/**
 * React Native Paper (Material Design 3) themes, tinted with the app's brand
 * color and aligned with the existing `Colors` palette. The matching React
 * Navigation themes are derived here too so navigation chrome and Paper
 * components share a single palette in both light and dark mode.
 */

import { DarkTheme as NavDarkTheme, DefaultTheme as NavLightTheme } from 'expo-router';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { Colors } from '@/constants/theme';

/** Brand color — matches the splash screen background in app.json. */
export const BRAND = '#208AEF';

export const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: BRAND,
    background: Colors.light.background,
    surface: Colors.light.background,
    surfaceVariant: Colors.light.backgroundElement,
    onBackground: Colors.light.text,
    onSurface: Colors.light.text,
  },
};

export const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: BRAND,
    background: Colors.dark.background,
    surface: Colors.dark.background,
    surfaceVariant: Colors.dark.backgroundElement,
    onBackground: Colors.dark.text,
    onSurface: Colors.dark.text,
  },
};

export const navigationLightTheme = {
  ...NavLightTheme,
  colors: {
    ...NavLightTheme.colors,
    primary: BRAND,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
  },
};

export const navigationDarkTheme = {
  ...NavDarkTheme,
  colors: {
    ...NavDarkTheme.colors,
    primary: BRAND,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
  },
};
