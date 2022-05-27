/* eslint-disable no-var */
import { DetailedHTMLProps, HTMLAttributes } from "react";
import "styled-components";

interface ShareData {
  text?: string;
  title?: string;
  url?: string;
}

declare global {
  var __DEV__: boolean;
  var SERVER: boolean;
  var VIZSLA_VERSION: string;
  namespace JSX {
    interface IntrinsicElements {
      center: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
      marquee: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        scrollAmount: string;
      };
    }
  }
}
