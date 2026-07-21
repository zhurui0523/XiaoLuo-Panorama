/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReferenceImage {
  id: string;
  data: string; // Base64 data URL
  mimeType: string;
  type: string;
}

export interface PanoramaPreset {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: "space" | "architecture" | "nature" | "scifi";
  isProcedural?: boolean;
}

export interface SmartImageConfig {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  imageSize: string;
  referenceImages?: ReferenceImage[];
}
