/** Quote-aware opening-tag scan ( ">" may legally appear inside an attribute value ). */
const TAG = /<[a-z][a-z0-9-]*(?:[^>"']|"[^"]*"|'[^']*')*>/g;

export const tagsWith = (html: string, needle: string) =>
  [...html.matchAll(TAG)].map((m) => m[0]).filter((t) => t.includes(needle));

export const isHidden = (tag: string) => /\shidden(\s|=|>)/.test(tag);
