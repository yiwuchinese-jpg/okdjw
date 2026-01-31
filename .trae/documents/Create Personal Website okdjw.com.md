# 创建 okdjw.com 个人网站开发计划

我们将基于 Next.js 14+ (App Router) 构建一个具有“叙事感”和“高动态交互”的个人品牌网站。

## 1. 技术栈初始化
- **核心框架**: Next.js 14 (TypeScript, App Router)
- **样式方案**: Tailwind CSS (配合 `shadcn/ui` 提升基础组件质感)
- **动画库**: Framer Motion (核心动效引擎)
- **滚动优化**: Lenis Scroll (实现丝滑的惯性滚动)
- **图标库**: Lucide React
- **3D/流体背景**: 使用 Canvas API 或 Spline 嵌入

## 2. 核心功能开发计划

### 第一阶段：项目骨架与 Hero Section (首屏)
- 初始化项目，配置全局主题（Cyberpunk/Minimalist Tech 风格，深色背景为主）。
- 实现 **Hero Section**:
    - 背景：极光流体效果或粒子扰动背景。
    - 主标题：打字机效果 ("Hi, I'm Justin Du." -> "I make things OK.")。
    - 进入动画：模糊渐变显现 (Blur Reveal)。

### 第二阶段：叙事性页面内容
- **About Me (关于我)**: 
    - 实现滚动视差 (Parallax) 效果。
    - 身份解构的三段式叙事 (Origin, Career, Name Story)。
- **My Stack (技能宇宙)**: 
    - 交互式翻转卡片，展示 Growth、Tech、Design 三大能力板块。
- **Featured Projects (项目展示)**: 
    - 实现 **横向滚动 (Horizontal Scroll)** 布局，展示 `chineseyiwu.com` 和 `buydiscoball.com` 等案例。

### 第三阶段：内容与互动
- **Tutorials (教程与思考)**: 极简卡片式列表。
- **Contact (联系方式)**: 巨大的 Email 链接及自定义圆形跟随光标。
- **Footer**: 版权及 Yiwu 标识。

### 第四阶段：细节打磨与部署
- 集成 Lenis Scroll 确保全站滚动体验。
- 响应式适配，确保移动端也有良好的视觉冲击力。

## 3. 待确认事项
- 您是否有特定的 3D 模型需求，或者我们先从高性能的 Canvas 流体背景开始？
- 网站的图片素材（如个人照、项目截图）是否已有准备？

您是否同意按照此计划开始执行？我们将首先从初始化项目和编写 Hero Section 开始。