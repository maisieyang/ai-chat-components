declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown';

  export function gfm(service: TurndownService): TurndownService;
  export default function gfmPlugin(service: TurndownService): TurndownService;
}
