/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Send, 
  Loader2, 
  Compass, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Plus,
  Zap,
  Box,
  Layers,
  RotateCcw,
  UploadCloud,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';
import { PanoramaViewer } from './PanoramaViewer';
import { generateProceduralPanorama, ProceduralType } from './ProceduralGenerator';

interface PanoramaCreationModalProps {
  onGenerate: (prompt: string, referenceImages?: any[], negativePrompt?: string) => Promise<string | null>;
  initialPrompt?: string;
}

export const PanoramaCreationModal: React.FC<PanoramaCreationModalProps> = ({ 
  onGenerate, 
  initialPrompt 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<any[]>([]);
  const [isFileDragging, setIsFileDragging] = useState(false);
  
  // Advanced generation specs
  const [autoCorrectSeams, setAutoCorrectSeams] = useState(true);
  const [autoStraighten, setAutoStraighten] = useState(true);
  const [fourGridMode, setFourGridMode] = useState(true);
  const [selectedResolution, setSelectedResolution] = useState("4K");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customUploadRef = useRef<HTMLInputElement>(null);

  // Preset Panorama Images - Curated beautifully for the user
  const PRESETS = useMemo(() => [
    {
      id: 'sainte-chapelle',
      title: "巴黎圣礼拜堂 Sainte-Chapelle",
      description: "璀璨斑斓的中世纪皇家礼拜堂，四周包裹着上千块折射金色阳光的哥特式彩色玻璃窗，光华夺目。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/dd/360-degree_panorama_of_the_interior_of_the_Sainte-Chapelle.jpg",
      category: "architecture",
      author: "Wikimedia Commons"
    },
    {
      id: 'strahov-library',
      title: "巴洛克斯特拉霍夫图书馆 Strahov Library",
      description: "捷克最著名的巴洛克图书馆，高耸的穹顶雕刻壁画、厚重的胡桃木书橱，散发深邃宏伟的学术历史厚重感。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/12/Grand_Hall_of_the_Strahov_Library_-_360_x_180_degrees_panorama.jpg",
      category: "architecture",
      author: "Wikimedia Commons"
    },
    {
      id: 'astronomical-observatory',
      title: "帕拉纳尔星河天文台 ESO Paranal",
      description: "智利高海拔阿塔卡马沙漠，720度无边银河浩瀚璀璨，银河星宿跨天而过，深空中繁星闪闪，静谧而深邃。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/43/ESO_Paranal_360_panorama.jpg",
      category: "space",
      author: "Wikimedia Commons"
    },
    {
      id: 'whitehouse-redroom',
      title: "古典白宫红厅 Red Room Interior",
      description: "华丽经典的白宫红厅会客室内，深红色丝绸墙壁、璀璨帝国式水晶大吊灯与欧式油画，完美的室内空间对称美学。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Red_Room_360_panorama.jpg",
      category: "architecture",
      author: "Wikimedia Commons"
    },
    {
      id: 'procedural-tron',
      title: "【科幻】Tron 极速网格 (本地 procedural)",
      description: "完全本地算力生成的霓虹数码 Tron 网格空间。视线远端伴随科幻落日，网格地平线对称循环，100%无缝拼合。",
      imageUrl: "procedural-grid",
      category: "scifi",
      isProcedural: true
    },
    {
      id: 'procedural-nebula',
      title: "【宇宙】深空星海星云 (本地 procedural)",
      description: "完全本地绘制的浪漫紫粉彩色星云，数万颗明暗闪烁星子与一艘折射冷光的多重光环远景行星，宛若置身梦境。",
      imageUrl: "procedural-nebula",
      category: "space",
      isProcedural: true
    },
    {
      id: 'procedural-cyberpunk',
      title: "【赛博】朋克霓虹夕阳 (本地 procedural)",
      description: "完全本地算力渲染的赛博朋克深空夕阳，远端林立的高耸大楼剪影与地表流淌的数码赛博霓虹浪网交互映衬。",
      imageUrl: "procedural-cyberpunk",
      category: "scifi",
      isProcedural: true
    },
    {
      id: 'procedural-inkwash',
      title: "【中国风】禅意水墨山水 (本地 procedural)",
      description: "国画写意山水，浓墨、淡墨、水雾交融。河面泛一叶扁舟、两岸竹影婆娑，古典文静的中式 720 度全景透视画幅。",
      imageUrl: "procedural-inkwash",
      category: "nature",
      isProcedural: true
    }
  ], []);

  const [activeUrl, setActiveUrl] = useState<string>('');
  const [activeTitle, setActiveTitle] = useState<string>('');

  useEffect(() => {
    setGeneratedUrl(null);
    setError(null);
    setPrompt(initialPrompt || '');
    setActiveUrl('');
    setActiveTitle('');
  }, [initialPrompt]);

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setError(null);
    setActiveTitle(preset.title);
    if (preset.isProcedural) {
      // Generate procedural data-url on the fly
      const typeMap: Record<string, ProceduralType> = {
        'procedural-grid': 'grid',
        'procedural-nebula': 'nebula',
        'procedural-cyberpunk': 'cyberpunk',
        'procedural-inkwash': 'inkwash'
      };
      const key = typeMap[preset.imageUrl] || 'grid';
      const dataUrl = generateProceduralPanorama(key);
      setActiveUrl(dataUrl);
    } else {
      setActiveUrl(preset.imageUrl);
    }
  };

  const combinedPrompt = useMemo(() => {
    const basePrompt = prompt.trim();
    if (!basePrompt) return '';
    const triggerWords = "360度等距柱状投影全景，720度无缝环绕VR图片";
    let constraints = "写实摄影构图，4k超高清分辨率";
    if (autoStraighten) constraints += "，天顶天底无鱼眼扭曲，地平线直线透视";
    if (autoCorrectSeams) constraints += "，左右拼合边缘完全无缝对齐";
    if (fourGridMode) constraints += "，超凡细节对齐";
    return `${triggerWords}。场景描述：${basePrompt}。视觉参数：${constraints}。高动态范围，写实摄影画风。`;
  }, [prompt, autoStraighten, autoCorrectSeams, fourGridMode]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating || generatingRef.current) return;
    
    generatingRef.current = true;
    setIsGenerating(true);
    setError(null);

    const negativePrompt = "立方体拼接，3D多边形错层，明显垂直缝隙，拼合重叠，画面破裂，极地漩涡扭曲，低清晰度，变形，水印，文字，色差";

    try {
      const url = await onGenerate(combinedPrompt, referenceImages, negativePrompt);
      if (url) {
        setGeneratedUrl(url);
        setActiveUrl(url);
        setActiveTitle(`AI 实时生成: ${prompt}`);
      } else {
        setError('模型生成失败，当前账号可能没有开通 Image API 或额度不足。已为您保留当前全景视图。');
      }
    } catch (err) {
      setError('发生错误，请检查网络后重试');
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  };

  const removeReferenceImage = (id: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setReferenceImages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          data,
          mimeType: file.type,
          type: 'general'
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    processFiles(files);
  };

  // Custom local panorama explorer upload
  const handleCustomPanoramaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setActiveUrl(data);
        setActiveTitle(`自定义导入: ${file.name}`);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePanoramaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setActiveUrl(data);
        setActiveTitle(`自定义导入: ${file.name}`);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full h-screen bg-[#f8fafc] flex flex-col overflow-hidden text-slate-800">
      {/* 2. Content Layout - Full Width Single Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc] p-6 relative">
        {/* Central Rounded Viewport Window */}
        <div 
          className={`flex-1 bg-white rounded-[32px] border transition-all duration-300 overflow-hidden relative min-h-[250px] flex flex-col ${
            isFileDragging 
              ? "border-indigo-400 bg-indigo-50/20 ring-4 ring-indigo-50" 
              : "border-slate-100 shadow-sm"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handlePanoramaDrop}
        >
          
          {isGenerating ? (
            /* Elegant Generation Loader with Spinning Compass matching Image 1 scale */
            <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
                <Compass className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-slow" />
              </div>
              <div className="text-center space-y-1 select-none">
                <p className="text-sm font-black text-slate-800">正在构建 360° 等距柱状全景...</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rendering Equirectangular Horizon</p>
              </div>
            </div>
          ) : activeUrl ? (
            /* The Actual Active Panorama Viewer */
            <PanoramaViewer 
              key={activeUrl}
              imageUrl={activeUrl} 
              onClose={() => {
                setActiveUrl('');
                setActiveTitle('');
              }}
              title={activeTitle}
              closeText="重置"
              onSeamHealed={(newUrl) => {
                setActiveUrl(newUrl);
                if (generatedUrl) setGeneratedUrl(newUrl);
              }}
            />
          ) : (
            /* Centered Local Panorama Explorer Upload (Red Box replacement of central view) */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto select-none">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-800 shadow-sm mb-6 animate-pulse">
                <UploadCloud className="w-7 h-7 text-slate-800" />
              </div>
              
              <h3 className="text-base font-black text-slate-900 tracking-tight mb-2 flex items-center gap-2 justify-center">
                <span>本地全景极速探索引擎</span>
              </h3>
              
              <p className="text-xs text-slate-500 leading-relaxed mb-8 max-w-xs">
                拖入或选择上传您本地的 <span className="font-bold text-slate-800">2:1 等距柱状投影全景图</span>，即可开启超流畅 of 720° VR 三维虚拟漫游。
              </p>
              
              <button
                onClick={() => customUploadRef.current?.click()}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold shadow-md shadow-slate-900/10 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-white" />
                <span>选择本地全景图</span>
              </button>
              
              <input 
                type="file" 
                ref={customUploadRef} 
                onChange={handleCustomPanoramaUpload}
                className="hidden" 
                accept="image/*" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
