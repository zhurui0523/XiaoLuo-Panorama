/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Loader2, 
  Camera, 
  Download, 
  Sliders, 
  RotateCcw, 
  ChevronRight, 
  Layers, 
  Footprints,
  Eye,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PanoramaCore } from './PanoramaCore';
import type { PanoramaCoreHandle, PanoramaViewState } from './PanoramaCore';

export interface PanoramaViewerProps {
  imageUrl: string;
  onClose: () => void;
  title?: string;
  closeText?: string;
  onSeamHealed?: (newUrl: string) => void;
  theme?: 'light' | 'dark';
  cornerRadius?: React.CSSProperties['borderRadius'];
  imageLoadStrategy?: 'fetch' | 'direct';
  onCapture?: (capture: PanoramaCaptureResult) => void | Promise<void>;
  className?: string;
  style?: React.CSSProperties;
}

export interface PanoramaCaptureResult {
  dataUrl: string;
  kind: 'viewport' | 'architectural';
}

export const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ 
  imageUrl, 
  onClose, 
  title, 
  closeText,
  onSeamHealed,
  theme = 'light',
  cornerRadius = 0,
  imageLoadStrategy = 'fetch',
  onCapture,
  className = '',
  style,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshotting, setSnapshotting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProTools, setShowProTools] = useState(false);
  
  const fovRef = useRef(110);
  const [fov, setFovState] = useState(110);

  const setFov = (val: number) => {
    fovRef.current = val;
    setFovState(val);
  };

  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(180);
  const [horizontalOffset, setHorizontalOffset] = useState(0); 
  const [verticalOffset, setVerticalOffset] = useState(0);     
  const [perspectiveCorrection, setPerspectiveCorrection] = useState(0); 
  const [isShiftMode, setIsShiftMode] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  
  // Physical Walk Simulation State
  const [walkState, setWalkState] = useState({
    scale: 1,
    x: 0,
    y: 0,
    bob: 0,
  });

  const [currentUrl, setCurrentUrl] = useState(imageUrl);
  const [keysPressed, setKeysPressed] = useState<Record<string, boolean>>({});
  const walkRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const momentumRef = useRef({ x: 0, z: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<PanoramaCoreHandle>(null);

  useEffect(() => {
    setCurrentUrl(imageUrl);
  }, [imageUrl]);

  // Capture WASD only while walk mode is enabled and this viewer owns focus.
  useEffect(() => {
    if (!isWalking) return;
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
        setKeysPressed(prev => ({ ...prev, [k]: true }));
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      setKeysPressed(prev => ({ ...prev, [k]: false }));
    };

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keyup', handleKeyUp);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('keyup', handleKeyUp);
      setKeysPressed({});
    };
  }, [isWalking]);

  // WASD Walk Simulation Engine (creates actual parallax perspective shift inside WebGL view)
  useEffect(() => {
    if (!isWalking) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      momentumRef.current = { x: 0, z: 0 };
      setWalkState({ scale: 1, x: 0, y: 0, bob: 0 });
      return;
    }

    const animate = () => {
      const friction = 0.94;
      const acceleration = 0.12;

      let targetX = 0;
      let targetZ = 0;

      if (keysPressed['w'] || keysPressed['arrowup']) targetZ += acceleration;
      if (keysPressed['s'] || keysPressed['arrowdown']) targetZ -= acceleration;
      if (keysPressed['a'] || keysPressed['arrowleft']) targetX -= acceleration;
      if (keysPressed['d'] || keysPressed['arrowright']) targetX += acceleration;

      momentumRef.current.x = (momentumRef.current.x + targetX) * friction;
      momentumRef.current.z = (momentumRef.current.z + targetZ) * friction;

      const speed = Math.sqrt(momentumRef.current.x ** 2 + momentumRef.current.z ** 2);
      walkRef.current += speed * 0.12;
      const isMoving = speed > 0.05;
      
      const bobAmount = isMoving ? Math.sin(walkRef.current) * (speed * 1.5) : Math.sin(Date.now() / 1500) * 0.3;
      
      setWalkState(prev => ({
        scale: 1.0 + Math.max(0, momentumRef.current.z * 0.002),
        x: Math.max(-25, Math.min(25, prev.x + momentumRef.current.x * 1.5)),
        y: prev.y,
        bob: bobAmount
      }));

      // Sync with the embedded core for yaw / FOV movement.
      const view = coreRef.current?.getView();
      if (view && (isMoving || speed > 0.01)) {
        
        // Forward walk decreases/increases FOV slightly to convey depth motion
        const fovTarget = momentumRef.current.z * -0.4;
        const nextFov = Math.max(50, Math.min(125, view.hfov + fovTarget));
        
        // Sidestepping turns the camera view yaw slightly
        const yawShift = momentumRef.current.x * 0.15;
        coreRef.current?.setView({ hfov: nextFov, yaw: view.yaw + yawShift });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isWalking, keysPressed]);

  const toggleWalking = () => {
    setIsWalking((enabled) => !enabled);
    requestAnimationFrame(() => coreRef.current?.focus());
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (!currentUrl) return;

    setLoading(true);
    setError(null);

    let activeObjectUrl: string | null = null;
    let cancelled = false;

    const fetchImage = async () => {
      setLocalUrl(null);
      try {
        if (imageLoadStrategy === 'direct') {
          if (!cancelled) setLocalUrl(currentUrl);
          return;
        }

        if (currentUrl.startsWith('data:') || currentUrl.startsWith('blob:')) {
          if (!cancelled) {
            setLocalUrl(currentUrl);
            setLoading(false);
          }
          return;
        }

        let response: Response;
        try {
          response = await fetch(currentUrl, { mode: 'cors' });
        } catch (e) {
          // CORS fallback proxy
          const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(currentUrl)}`;
          response = await fetch(proxyUrl);
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        
        if (!blob || blob.size === 0) throw new Error("Received empty blob");

        activeObjectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(activeObjectUrl);
          activeObjectUrl = null;
          return;
        }
        setLocalUrl(activeObjectUrl);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch panorama image:", err);
        if (!cancelled) {
          setLocalUrl(currentUrl); // Try direct fallback
          setLoading(false);
        }
      }
    };

    void fetchImage();

    return () => {
      cancelled = true;
      if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    };
  }, [currentUrl, imageLoadStrategy]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const [showFlash, setShowFlash] = useState(false);

  // High resolution viewport snapshot capture
  const takeSnapshot = (kind: PanoramaCaptureResult['kind'] = 'viewport') => {
    if (snapshotting || loading) return;
    
    setSnapshotting(true);
    setShowFlash(true);
    
    setTimeout(async () => {
      setShowFlash(false);
      
      const core = coreRef.current;
      if (!core) {
        setSnapshotting(false);
        return;
      }

      try {
        const dataUrl = core.captureScreenshot();
        
        if (!dataUrl || dataUrl.length < 500) {
          throw new Error("Captured image data is corrupted or empty");
        }

        if (onCapture) {
          await onCapture({ dataUrl, kind });
        } else {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `VR_view_snapshot_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        setTimeout(() => setSnapshotting(false), 800);
      } catch (err) {
        console.error("Capture error:", err);
        alert("截图失败，请在浏览器新标签页中打开并重试。");
        setSnapshotting(false);
      }
    }, 450);
  };

  const downloadOriginal = () => {
    const url = localUrl || imageUrl;
    if (!url) return;
    
    const link = document.createElement('a');
    link.href = url;
    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    link.download = `VR_panorama_original_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    coreRef.current?.setView({ hfov: fov });
  }, [fov]);

  useEffect(() => {
    coreRef.current?.setView({ pitch: isShiftMode ? 0 : pitch }, true);
  }, [isShiftMode]);



  const takeArchitecturalCapture = () => {
    if (coreRef.current) {
      coreRef.current.setView({ pitch: 0 }, true);
      setTimeout(() => takeSnapshot('architectural'), 500);
    }
  };

  const resetProTools = () => {
    setFov(110);
    setPitch(0);
    setHorizontalOffset(0);
    setVerticalOffset(0);
    setPerspectiveCorrection(0);
    coreRef.current?.reset(true);
  };

  const handleViewChange = (view: PanoramaViewState) => {
    const nextPitch = Math.round(view.pitch);
    const nextYaw = Math.round(view.yaw);
    setPitch(nextPitch);
    setYaw(nextYaw);

    const extraFov = Math.abs(view.pitch) > 60
      ? (Math.abs(view.pitch) - 60) * 0.35
      : 0;
    const correctedFov = Math.min(150, fovRef.current + extraFov);
    if (Math.abs(view.hfov - correctedFov) > 0.5) {
      coreRef.current?.setView({ hfov: correctedFov });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`xiaoluo-panorama-viewer ${theme === 'dark' ? 'dark' : ''} absolute inset-0 z-[100] flex items-center justify-center bg-[#f3f4f6] dark:bg-[#0a0a0f] overflow-hidden ${className}`}
      data-theme={theme}
      ref={containerRef}
      style={{
        '--h-offset': `${horizontalOffset}px`,
        '--v-offset': `${verticalOffset}px`,
        '--perspective': `${perspectiveCorrection}deg`,
        borderRadius: cornerRadius,
        ...style,
      } as React.CSSProperties}
    >


      {/* Floating Control Bar - Styled Exactly like Image 1 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-between w-auto max-w-[95%] bg-white/95 dark:bg-[#14141c]/95 backdrop-blur-xl border border-slate-100 dark:border-[#2a2a3a] shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-full px-6 py-2.5 gap-4">
        <div className="flex items-center gap-1.5 border-r border-slate-100 dark:border-[#2a2a3a] pr-4">
          <button
            onClick={toggleWalking}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-xs font-black active:scale-95 ${
              isWalking 
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-100" 
                : "text-slate-600 dark:text-[#aaaabc] hover:bg-slate-50 dark:hover:bg-[#252535]"
            }`}
            title="自由漫游模式: 使用 WASD 键或方向键走动"
          >
            <Footprints className="w-4 h-4" />
            <span>{isWalking ? '正在漫游' : 'WASD 漫游'}</span>
          </button>

          <button
            onClick={() => setShowProTools(!showProTools)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-xs font-black active:scale-95 ${
              showProTools 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                : "text-slate-600 dark:text-[#aaaabc] hover:bg-slate-50 dark:hover:bg-[#252535]"
            }`}
            title="镜头微调与高级参数"
          >
            <Sliders className="w-4 h-4" />
            <span>视觉矫正</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 pr-4 border-r border-slate-100 dark:border-[#2a2a3a]">
          <button
            onClick={() => takeSnapshot()}
            disabled={snapshotting || loading}
            className={`p-2.5 hover:bg-slate-50 dark:hover:bg-[#252535] text-slate-600 dark:text-[#aaaabc] rounded-full transition-all active:scale-95 ${
              snapshotting || loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="捕获当前视角截图"
          >
            {snapshotting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          
          <button
            onClick={downloadOriginal}
            className="p-2.5 hover:bg-slate-50 dark:hover:bg-[#252535] text-slate-600 dark:text-[#aaaabc] rounded-full transition-all active:scale-95 md:block hidden"
            title="下载原始等距柱状全景大图"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2.5 hover:bg-slate-50 dark:hover:bg-[#252535] text-slate-600 dark:text-[#aaaabc] rounded-full transition-all active:scale-95 md:block hidden"
            title={isFullscreen ? "退出全屏" : "全屏模式"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Zoom Indicator - Matching Image 1 style: - 100% + */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#252535] px-3.5 py-1.5 rounded-full text-xs font-black text-slate-600 dark:text-[#e8e8ed] select-none">
          <button 
            onClick={() => setFov(Math.min(150, fov + 5))}
            className="text-slate-400 dark:text-[#8888a0] hover:text-slate-700 dark:hover:text-[#e8e8ed] transition-colors"
            title="缩小"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono min-w-[34px] text-center">
            {Math.round((110 / fov) * 100)}%
          </span>
          <button 
            onClick={() => setFov(Math.max(40, fov - 5))}
            className="text-slate-400 dark:text-[#8888a0] hover:text-slate-700 dark:hover:text-[#e8e8ed] transition-colors"
            title="放大"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-[#e8e8ed] hover:bg-slate-800 dark:hover:bg-white text-white dark:text-[#14141c] rounded-full transition-all active:scale-95 font-bold text-xs"
        >
          <X className="w-3.5 h-3.5" />
          <span>{closeText || '关闭'}</span>
        </button>
      </div>

      {/* Advanced Pro Camera Tools Panel */}
      <AnimatePresence>
        {showProTools && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className="absolute top-24 right-6 z-30 w-72 bg-white/95 dark:bg-[#14141c]/95 backdrop-blur-xl border border-slate-100 dark:border-[#2a2a3a] rounded-3xl p-6 shadow-[0_16px_48px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.35)] overflow-hidden text-slate-800 dark:text-[#e8e8ed]"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h4 className="text-slate-800 dark:text-[#e8e8ed] font-black text-xs uppercase tracking-wider">高级相机参数</h4>
              </div>
              <button 
                onClick={resetProTools}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-[#252535] rounded-full text-slate-400 dark:text-[#8888a0] hover:text-slate-600 dark:hover:text-[#e8e8ed] transition-all"
                title="重置全部微调"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Shift Lens Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#1a1a26] rounded-2xl border border-slate-100 dark:border-[#2a2a3a]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-700 dark:text-[#e8e8ed] font-black text-xs">移轴模式 (Shift Lens)</span>
                  <span className="text-[9px] text-slate-400 dark:text-[#8888a0]">锁定水平视线，矫正建筑垂直畸变</span>
                </div>
                <button 
                  onClick={() => setIsShiftMode(!isShiftMode)}
                  className={`w-9 h-5 rounded-full transition-all relative ${
                    isShiftMode ? "bg-indigo-600" : "bg-slate-200 dark:bg-[#2a2a3a]"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    isShiftMode ? "left-4.5" : "left-0.5"
                  }`} />
                </button>
              </div>

              {/* FOV Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">镜头焦距 (FOV)</label>
                  <span className="text-xs font-mono text-indigo-600 font-bold">{fov}°</span>
                </div>
                <input 
                  type="range" min="40" max="140" step="1" 
                  value={fov} onChange={(e) => setFov(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Spatial Offset Sliders */}
              <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-[#2a2a3a]">
                <div className="flex items-center gap-1.5 mb-1">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">空间位移补偿 (Offset)</label>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-[#aaaabc]">水平偏移 (X-Pivot)</label>
                    <span className="text-[10px] font-mono text-slate-400">{horizontalOffset}px</span>
                  </div>
                  <input 
                    type="range" min="-80" max="80" step="1" 
                    value={horizontalOffset} onChange={(e) => setHorizontalOffset(Number(e.target.value))}
                    className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-[#aaaabc]">垂直偏移 (Y-Pivot)</label>
                    <span className="text-[10px] font-mono text-slate-400">{verticalOffset}px</span>
                  </div>
                  <input 
                    type="range" min="-40" max="40" step="1" 
                    value={verticalOffset} onChange={(e) => setVerticalOffset(Number(e.target.value))}
                    className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-600"
                  />
                </div>
              </div>

              {/* Perspective Correction */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2a2a3a]">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">视线畸变拉伸 (Perspective)</label>
                  <span className="text-xs font-mono text-indigo-600 font-bold">{perspectiveCorrection}°</span>
                </div>
                <input 
                  type="range" min="-12" max="12" step="0.5" 
                  value={perspectiveCorrection} onChange={(e) => setPerspectiveCorrection(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
              </div>


            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#2a2a3a] space-y-2">
              <button 
                onClick={takeArchitecturalCapture}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 dark:shadow-none rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>移轴平面截图 (Arch-Capture)</span>
              </button>
              <p className="text-[8px] text-slate-400 text-center leading-normal">
                自动对齐地平线，输出透视正确的 2D 空间构图图片
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The main canvas viewport with CSS Parallax Transformation Layers */}
      <PanoramaCore
        ref={coreRef}
        imageUrl={localUrl || ''}
        className="w-full h-full bg-slate-100 dark:bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center origin-center"
        initialPitch={0}
        initialYaw={180}
        initialHfov={110}
        onLoad={() => setLoading(false)}
        onError={(message) => {
          console.error('Pannellum error:', message);
          setError(message || '加载全景图时出错');
          setLoading(false);
        }}
        onViewChange={handleViewChange}
        style={{
          transform: `
            translate(calc(var(--h-offset) + ${walkState.x}px), calc(var(--v-offset) + ${walkState.y + walkState.bob}px)) 
            rotateX(var(--perspective)) 
            scale(${walkState.scale})
          `,
          transition: isWalking ? 'none' : 'transform 0.45s cubic-bezier(0.2, 0, 0.2, 1)'
        }}
      />

      {/* Visual Flash Snapshot Effect */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>



      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-50/80 dark:bg-[#0a0a0f]/80 backdrop-blur-md flex flex-col items-center justify-center z-10 gap-3">
          <div className="relative">
            <div className="w-14 h-14 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <Sliders className="w-5 h-5 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-slate-800 dark:text-[#e8e8ed] text-sm font-black">正在载入球面全景空间...</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Initializing Equirectangular Space</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-white/95 dark:bg-[#0a0a0f]/95 backdrop-blur-md p-6">
          <div className="max-w-sm w-full bg-white dark:bg-[#14141c] border border-slate-100 dark:border-[#2a2a3a] p-8 rounded-[32px] text-center shadow-[0_16px_48px_rgba(0,0,0,0.06)]">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h4 className="text-slate-800 dark:text-[#e8e8ed] text-lg font-black mb-1.5">全景初始化失败</h4>
            <p className="text-slate-500 dark:text-[#8888a0] text-xs mb-6 leading-relaxed">
              由于网络资源受限或全景文件格式不合规，导致无法正常解析。请尝试切换其他场景。
            </p>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all active:scale-95"
            >
              返回控制台
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
