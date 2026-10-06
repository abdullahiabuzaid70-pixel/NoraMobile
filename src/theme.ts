/**
 * Theme bridge — the legacy `theme` object now flows from the locked
 * design tokens. Existing screens keep compiling; values are canonical.
 */
import { palette } from './design-system/tokens';

export const theme = { ...palette };
