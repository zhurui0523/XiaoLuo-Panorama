# 小逻-VR全景浏览器 (Xiaoluo VR Panorama)

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/xiaoluo-vr-panorama)
[![License](https://img.shields.io/badge/license-Apache--2.0-green.svg)](LICENSE)

**小逻-VR全景浏览器 (Xiaoluo VR Panorama)** 是一款专为 React 开发的专业级 720° 沉浸式全景虚拟现实（VR）浏览器与生成器组件库。

它集成了三维透视校正（Perspective Correction）、移轴模式（Shift Lens）、多维度空间偏移（X/Y Offset）以及本地离线算力渲染的多种超炫全景图（太空星云、赛博朋克、数字网格、禅意水墨）生成引擎，提供极致高雅且流畅的沉浸式空间感官体验。

---

## ✨ 核心特性

- **720° 自由探索**：无死角的全景空间自由漫游与 WASD 键盘导航，完美集成移动端陀螺仪与平滑手势阻尼。
- **专业相机参数校正**：
  - **移轴模式 (Shift Lens)**：锁定地平线，完美矫正建筑及空间物体的近大远小垂直畸变（防倾斜畸变）。
  - **超广镜头焦距 (FOV)**：动态范围焦距滑块调整，支持广角到长焦的丝滑缩放。
  - **空间位移补偿 (OFFSET)**：可调节水平 (X-Pivot) 与垂直 (Y-Pivot) 视角，创造完美的 3D 偏振透视感。
- **动态离线生成引擎 (Procedural Generator)**：不需要任何云端服务器或 API 密钥，直接通过纯前端算法实时绘制：
  - **【科幻】Tron 极速网格**：霓虹数码地平线，100% 理想拼合。
  - **【宇宙】浪漫粉紫星云**：伴随自转公转的多光环行星与上万颗闪烁恒星。
  - **【赛博】朋克霓虹夕阳**：流光溢彩的摩天大楼剪影。
  - **【中国风】禅意水墨山水**：独创国画留白与水墨烟雨透视效果。
- **高级 AI 对话生成式交互**：内建漂亮的对话式与多模态参考底图全景生成交互容器。
- **奢华视觉交互设计**：完全基于 **Tailwind CSS** 与 **Framer Motion** 设计的拟物微动视效、磨砂高亮控制面板、高对比度专业级布局。

---

## 📦 安装

使用 npm 或 yarn 安装组件库及 Peer Dependencies：

```bash
npm install xiaoluo-vr-panorama

# 确保项目中已安装以下对等依赖 (Peer Dependencies)
npm install react react-dom motion lucide-react pannellum
```

---

## 🚀 快速上手

### 1. 引入组件与样式

在你的 React 应用中直接引入组件。需要将组件库编译出来的 CSS 样式导入：

```tsx
import React from 'react';
import { PanoramaCreationModal } from 'xiaoluo-vr-panorama';

// 导入组件库自带的 CSS 样式
import 'xiaoluo-vr-panorama/dist/xiaoluo-vr-panorama.css';

export default function App() {
  // 处理 AI 或云端全景图生成请求（可选）
  const handleGenerate = async (
    prompt: string, 
    referenceImages?: any[], 
    negativePrompt?: string
  ): Promise<string | null> => {
    // 你可以在这里对接你自己的云端图像生成 API（如 Gemini / Midjourney / Stable Diffusion）
    console.log("Generating with prompt:", prompt);
    
    // 返回生成的图片 URL
    return "https://example.com/generated-panorama.jpg";
  };

  return (
    <div className="w-full h-screen bg-[#F8F9FA]">
      <PanoramaCreationModal 
        onGenerate={handleGenerate}
        initialPrompt="写实科幻太空舱内部，中央巨大弧形玻璃窗，外侧深蓝色浩瀚星海"
      />
    </div>
  );
}
```

---

## 🔧 API 参考

### 1. `PanoramaViewer`

全景浏览器核心渲染组件。

```tsx
import { PanoramaViewer } from 'xiaoluo-vr-panorama';
```

| 属性名 (Prop) | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `imageUrl` | `string` | **必填** | 全景图 URL（可传入网络 URL、本地 base64 或 `procedural-` 开头的生成器标识） |
| `onClose` | `() => void` | **必填** | 关闭全景浏览器时的回调函数 |
| `title` | `string` | `""` | 顶部状态栏显示的空间标题 |
| `author` | `string` | `""` | 空间作者/版权归属标识 |
| `onSeamHealed`| `(newUrl: string) => void` | - | 拼合边缘时的回调（选填） |

---

### 2. `PanoramaCreationModal`

全套沉浸式全景生成与游览画廊容器组件。

```tsx
import { PanoramaCreationModal } from 'xiaoluo-vr-panorama';
```

| 属性名 (Prop) | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `onGenerate` | `(prompt: string, referenceImages?: any[], negativePrompt?: string) => Promise<string \| null>` | **必填** | 触发生成全景图的后台 API 请求 |
| `initialPrompt` | `string` | `""` | 输入框初始预设的 AI 描述文本词 |

---

### 3. `generateProceduralPanorama`

离线算力全景贴图生成函数，返回一个 `Promise<string>` (Base64 DataURL)。

```tsx
import { generateProceduralPanorama } from 'xiaoluo-vr-panorama';

// 异步渲染一张 4096 * 2048 的太空星云全景
const nebulaBase64 = await generateProceduralPanorama('procedural-nebula');
```

---

## 🎨 样式定制 (Tailwind)

本组件库的所有 UI 面板完全采用标准 Tailwind Utility 类开发。如果你想自定义主题颜色或字体，只需在你的 `tailwind.config` 或核心 `index.css` 中覆盖以下变量：

```css
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}
```

---

## 🛠️ 本地开发与贡献

如果你想要克隆本项目并进行本地测试与二次开发：

### 安装依赖
```bash
npm install
```

### 启动本地开发服务（运行 DEMO 在线预览）
```bash
npm run dev
```

### 编译并输出 NPM 库代码
```bash
npm run build:lib
```
编译成功后，产物会输出到根目录的 `/dist` 文件夹下，包含：
- `xiaoluo-vr-panorama.js` (ES Module 模块包)
- `xiaoluo-vr-panorama.umd.cjs` (通用 UMD 格式包)
- `index.d.ts` 与 `types.d.ts` (完整的 TypeScript 类型定义)
- `xiaoluo-vr-panorama.css` (打包好的原子样式文件)

---

## 📄 开源协议

本项目基于 **Apache-2.0** 协议开源。欢迎提交 Issue 与 Pull Request 共同完善小逻系列空间全景生态！
