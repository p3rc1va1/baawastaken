import * as logos from './logos';
import * as scene from './scene';
import * as ui from './ui';

/** Every sprite on the page, by name. */
export const sprites = { ...logos, ...scene, ...ui };

export type SpriteName = keyof typeof sprites;
export type { SpriteDef } from './types';
