/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AspectRatioType = "1:1" | "9:16" | "16:9";

export type ThemeStyleType = "natural" | "premium" | "rustic" | "market" | "minimal" | "retro-neon" | "pastel-sweet" | "bold-future";

export type FrameMaskType = "none" | "circle" | "rounded" | "oval" | "gold-frame";

export interface AIResult {
  productType: string;
  analysis: string;
  suggestedHeadlines: string[];
  suggestedSubtitles: string[];
  badges: string[];
  recommendedThemeColors: {
    primary: string;
    secondary: string;
    bgStart: string;
    bgEnd: string;
  };
  socialCaption: string;
  isDemoMode?: boolean;
  demoMessage?: string;
}

export interface AdData {
  farmName: string;
  productName: string;
  secondaryText: string;
  priceTag: string;
  contact: string;
  lineId: string;
  aspectRatio: AspectRatioType;
  themeStyle: ThemeStyleType;
  frameMask: FrameMaskType;
  
  // Product canvas properties
  productScale: number;
  productX: number;
  productY: number;
  productRotation: number;
  
  // Badges
  badges: string[];
  selectedBadgeIndex1: number;
  selectedBadgeIndex2: number;
  customBadge1: string;
  customBadge2: string;
  
  // Custom colors chosen by AI or user
  primaryColor: string;
  secondaryColor: string;
  bgColorStart: string;
  bgColorEnd: string;

  // Font formatting
  farmAlign?: "left" | "center" | "right";
  headlineAlign?: "left" | "center" | "right";
  subtitleAlign?: "left" | "center" | "right";
  contactAlign?: "left" | "center" | "right";

  headlineFontSize: number;
  headlineBold: boolean;
  headlineItalic: boolean;
  headlineUnderline: boolean;
  headlineYOffset: number;
  headlineXOffset: number;
  
  subtitleFontSize: number;
  subtitleBold: boolean;
  subtitleItalic: boolean;
  subtitleUnderline: boolean;
  subtitleYOffset: number;
  subtitleXOffset: number;

  // Farm name formatting & position
  farmFontSize: number;
  farmBold: boolean;
  farmItalic: boolean;
  farmUnderline: boolean;
  farmYOffset: number;
  farmXOffset: number;

  // Contact formatting & position
  contactFontSize: number;
  contactBold: boolean;
  contactItalic: boolean;
  contactUnderline: boolean;
  contactYOffset: number;
  contactXOffset: number;

  // Price tag formatting & position
  priceFontSize: number;
  priceBold: boolean;
  priceItalic: boolean;
  priceUnderline: boolean;
  priceYOffset: number;
  priceXOffset: number;
  priceTagStyle: "circle" | "starburst" | "badge" | "ribbon";
  priceScale?: number;
}

export interface ImageDimension {
  width: number;
  height: number;
}
