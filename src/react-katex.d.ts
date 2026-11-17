// Minimal typings for react-katex, which ships without declaration files.
declare module "react-katex" {
  import type { FC } from "react";
  export const InlineMath: FC<{ math: string; errorColor?: string; renderError?: (error: Error) => React.ReactNode }>;
  export const BlockMath: FC<{ math: string; errorColor?: string; renderError?: (error: Error) => React.ReactNode }>;
}
