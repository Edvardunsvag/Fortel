/// <reference types="vite/client" />

declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}

declare module "string-similarity" {
  export function compareTwoStrings(str1: string, str2: string): number;
  export function findBestMatch(
    mainString: string,
    targetStrings: string[]
  ): {
    ratings: Array<{ target: string; rating: number }>;
    bestMatch: { target: string; rating: number };
    bestMatchIndex: number;
  };
}
