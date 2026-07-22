/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import 'pannellum';
import '../core.css';

export interface PanoramaViewState {
  pitch: number;
  yaw: number;
  hfov: number;
}

export interface PanoramaCoreHandle {
  captureScreenshot: () => string | null;
  focus: () => void;
  getView: () => PanoramaViewState | null;
  reset: (animated?: boolean | number) => void;
  resize: () => void;
  setView: (view: Partial<PanoramaViewState>, animated?: boolean | number) => void;
}

export interface PanoramaCoreProps {
  imageUrl: string;
  className?: string;
  style?: React.CSSProperties;
  initialPitch?: number;
  initialYaw?: number;
  initialHfov?: number;
  minHfov?: number;
  maxHfov?: number;
  draggable?: boolean;
  mouseZoom?: boolean;
  keyboardZoom?: boolean;
  autoLoad?: boolean;
  backgroundColor?: [number, number, number];
  crossOrigin?: 'anonymous' | 'use-credentials';
  onLoad?: () => void;
  onError?: (message: string) => void;
  onReady?: (handle: PanoramaCoreHandle) => void;
  onViewChange?: (view: PanoramaViewState) => void;
}

interface PannellumRenderer {
  render: (
    pitch: number,
    yaw: number,
    hfov: number,
    params: { returnImage: boolean },
  ) => string | undefined;
}

interface PannellumViewer {
  destroy: () => void;
  getHfov: () => number;
  getPitch: () => number;
  getRenderer: () => PannellumRenderer;
  getYaw: () => number;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  resize: () => void;
  setHfov: (hfov: number, animated?: boolean | number) => void;
  setPitch: (pitch: number, animated?: boolean | number) => void;
  setYaw: (yaw: number, animated?: boolean | number) => void;
}

interface PannellumGlobal {
  viewer: (container: HTMLElement, config: Record<string, unknown>) => PannellumViewer;
}

const toRadians = (degrees: number) => degrees * Math.PI / 180;
const DEFAULT_BACKGROUND_COLOR: [number, number, number] = [243, 244, 246];

export const PanoramaCore: React.ForwardRefExoticComponent<
  PanoramaCoreProps & React.RefAttributes<PanoramaCoreHandle>
> = forwardRef<PanoramaCoreHandle, PanoramaCoreProps>(
  function PanoramaCore({
    imageUrl,
    className = '',
    style,
    initialPitch = 0,
    initialYaw = 180,
    initialHfov = 110,
    minHfov = 40,
    maxHfov = 150,
    draggable = true,
    mouseZoom = true,
    keyboardZoom = true,
    autoLoad = true,
    backgroundColor = DEFAULT_BACKGROUND_COLOR,
    crossOrigin = 'anonymous',
    onLoad,
    onError,
    onReady,
    onViewChange,
  }, forwardedRef) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<PannellumViewer | null>(null);
    const callbacksRef = useRef({ onLoad, onError, onReady, onViewChange });
    const initialViewRef = useRef<PanoramaViewState>({
      pitch: initialPitch,
      yaw: initialYaw,
      hfov: initialHfov,
    });

    callbacksRef.current = { onLoad, onError, onReady, onViewChange };

    const handleRef = useRef<PanoramaCoreHandle>({
      captureScreenshot() {
        const viewer = viewerRef.current;
        if (!viewer) return null;

        try {
          const view = {
            pitch: viewer.getPitch(),
            yaw: viewer.getYaw(),
            hfov: viewer.getHfov(),
          };
          return viewer.getRenderer().render(
            toRadians(view.pitch),
            toRadians(view.yaw),
            toRadians(view.hfov),
            { returnImage: true },
          ) ?? null;
        } catch {
          return null;
        }
      },
      focus() {
        containerRef.current?.focus({ preventScroll: true });
      },
      getView() {
        const viewer = viewerRef.current;
        return viewer ? {
          pitch: viewer.getPitch(),
          yaw: viewer.getYaw(),
          hfov: viewer.getHfov(),
        } : null;
      },
      reset(animated = false) {
        const viewer = viewerRef.current;
        if (!viewer) return;
        const initialView = initialViewRef.current;
        viewer.setPitch(initialView.pitch, animated);
        viewer.setYaw(initialView.yaw, animated);
        viewer.setHfov(initialView.hfov, animated);
      },
      resize() {
        viewerRef.current?.resize();
      },
      setView(view, animated = false) {
        const viewer = viewerRef.current;
        if (!viewer) return;
        if (view.pitch !== undefined) viewer.setPitch(view.pitch, animated);
        if (view.yaw !== undefined) viewer.setYaw(view.yaw, animated);
        if (view.hfov !== undefined) viewer.setHfov(view.hfov, animated);
      },
    });

    useImperativeHandle(forwardedRef, () => handleRef.current, []);

    useEffect(() => {
      const container = containerRef.current;
      if (!container || !imageUrl) return;

      const pannellum = (
        window as Window & { pannellum?: PannellumGlobal }
      ).pannellum;
      if (!pannellum) {
        callbacksRef.current.onError?.('Pannellum is unavailable');
        return;
      }

      const viewer = pannellum.viewer(container, {
        type: 'equirectangular',
        panorama: imageUrl,
        pitch: initialViewRef.current.pitch,
        yaw: initialViewRef.current.yaw,
        hfov: initialViewRef.current.hfov,
        autoLoad,
        showZoomCtrl: false,
        showFullscreenCtrl: false,
        backgroundColor,
        compass: false,
        keyboardZoom,
        mouseZoom,
        draggable,
        minHfov,
        maxHfov,
        hfovBounds: [minHfov, maxHfov],
        friction: 0.15,
        multiRes: false,
        crossOrigin,
      });
      viewerRef.current = viewer;

      const emitView = () => {
        callbacksRef.current.onViewChange?.({
          pitch: viewer.getPitch(),
          yaw: viewer.getYaw(),
          hfov: viewer.getHfov(),
        });
      };

      viewer.on('load', () => callbacksRef.current.onLoad?.());
      viewer.on('error', (error) => {
        callbacksRef.current.onError?.(
          typeof error === 'string' ? error : 'Failed to load panorama',
        );
      });
      viewer.on('viewchange', emitView);
      viewer.on('zoomchange', emitView);
      callbacksRef.current.onReady?.(handleRef.current);

      const resizeObserver = new ResizeObserver(() => viewer.resize());
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        viewer.destroy();
        if (viewerRef.current === viewer) viewerRef.current = null;
      };
    }, [
      autoLoad,
      backgroundColor,
      crossOrigin,
      draggable,
      imageUrl,
      keyboardZoom,
      maxHfov,
      minHfov,
      mouseZoom,
    ]);

    return (
      <div
        ref={containerRef}
        className={`xiaoluo-panorama-core ${className}`.trim()}
        style={{ width: '100%', height: '100%', ...style }}
        data-panorama-core=""
      />
    );
  },
);
