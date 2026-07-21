/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PanoramaCreationModal } from './components/PanoramaCreationModal';

export default function App() {
  // Calls server-side Gemini generation endpoint
  const handleGenerate = async (
    prompt: string, 
    referenceImages?: any[], 
    negativePrompt?: string
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/panorama/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          referenceImages,
          negativePrompt,
          aspectRatio: '16:9' // 16:9 is standard high resolution widescreen ratio
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成失败');
      }

      const data = await response.json();
      return data.imageUrl || null;
    } catch (err: any) {
      console.error('Error generating panorama:', err);
      throw err;
    }
  };

  return (
    <div className="w-full h-screen bg-[#F8F9FA] flex flex-col font-sans select-none overflow-hidden text-slate-800">
      <PanoramaCreationModal 
        onGenerate={handleGenerate}
        initialPrompt="写实科幻太空舱内部，中央巨大弧形玻璃窗，外侧深蓝色浩瀚星海与遥远旋涡星系，高精度仪表台，冷色霓虹氛围灯"
      />
    </div>
  );
}
