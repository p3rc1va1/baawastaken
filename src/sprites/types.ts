/**
 * A sprite is data: a palette and one or two ASCII frames.
 * Every character in a frame is a palette key, or "." for a transparent pixel.
 * One art pixel is drawn as --px (4 CSS px) on the page.
 */
export interface SpriteDef {
  /** Art width in pixels. */
  w: number;
  /** Art height in pixels. */
  h: number;
  /** Single-character key to hex colour. "." is reserved for transparent. */
  palette: Record<string, string>;
  /** One frame, or two frames that alternate when animated. Each frame has h rows of w characters. */
  frames: string[][];
}
