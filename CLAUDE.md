# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

基于 React 19 + TypeScript + Vite 的网页版 EPUB 阅读器。用户通过文件选择或拖拽加载 `.epub` 文件，应用使用 `epubjs` 在浏览器中解析和渲染书籍。功能包括：目录导航、字体/主题设置、书签、阅读进度追踪和阅读历史（书架）。界面语言为简体中文。

## 开发命令

```bash
npm run dev        # 启动 Vite 开发服务器
npm run build      # 类型检查 (tsc -b) 后构建生产包
npm run lint       # ESLint 检查
npm run preview    # 预览生产构建
```

项目未配置测试框架（无 Vitest/Jest/Playwright），也无 Prettier 配置。

## 架构

**状态管理：** 纯 React Hooks + Props Drilling，无 Redux/Zustand/Context。

- **`App.tsx`** — 全局状态协调者。管理 `currentView`（`'home'`|`'reader'`）、`currentBookId` 以及侧边栏/弹窗的开关状态。无路由，视图切换完全由状态驱动。

- **`useReader`**（`src/hooks/useReader.ts`）— 封装所有 epubjs 交互。使用 `bookRef`/`renditionRef`（ref 而非 state，避免重渲染）。方法包括：`loadBook`、`renderTo`、`display`、`next`/`prev`、`goToTocItem`、`applyTheme`/`applyFontSettings`、`generateLocations`。

- **`useSettings`**（`src/hooks/useSettings.ts`）— 通过 localStorage 持久化用户数据：字体设置（大小/行高/字体族）、6 种主题、书签、阅读历史（最多 20 本书）。`getThemeColors()` 返回当前主题的 `{background, text, secondaryBg, border, icon}`。

**数据流：**
1. 用户上传 EPUB → `App.tsx` 读取 `ArrayBuffer` → `useReader.loadBook()` → epubjs 解析 metadata/TOC
2. 书籍加入历史记录，完整 `ArrayBuffer` 存入 localStorage
3. `Reader.tsx` 提供容器 ref → `useReader.renderTo()` → epubjs 渲染到 iframe
4. 翻页触发 epubjs `relocated` 事件 → 更新位置/进度状态
5. 设置变更通过 `useEffect` 同步到 Rendition

**关键架构细节：**
- 完整 EPUB 文件以 `ArrayBuffer` 存储在 localStorage（最多 20 本）——localStorage 通常有 5-10 MB 限制，大书籍可能导致存储溢出
- 自定义中文字体通过 `rendition.hooks.content.register()` 注入到 epubjs 的 iframe 中
- 滚轮/键盘翻页节流 300ms
- `themeColors` 对象通过 props 逐层传递，未使用 React Context
- 强调色 `#4a9eff` 在全局硬编码（未使用 CSS 变量）

## 关键路径

- `src/types/index.ts` — 所有 TypeScript 接口（集中定义）
- `src/components/ui/` — 54 个 shadcn/ui 组件（通过 shadcn CLI 管理）
- `public/fonts/` — 自定义中文字体文件（约 31 MB）
- 路径别名：`@/` → `src/`（在 `vite.config.ts` 和 `tsconfig.json` 中配置）

## 代码规范

- 组件：PascalCase 文件名（`Reader.tsx`、`FontSettings.tsx`）
- Hooks：camelCase，以 `use` 开头（`useReader.ts`、`useSettings.ts`）
- TypeScript 严格模式，启用 `noUnusedLocals`、`noUnusedParameters`、`erasableSyntaxOnly`
- 动画统一使用 Framer Motion，缓动函数 `[0.4, 0, 0.2, 1]`
- 移动端断点 768px（`useIsMobile` hook）；工具栏在桌面端为右侧栏，移动端为底部栏
- 修改 UI 时，先检查 `src/components/ui/` 是否已有可用的 shadcn 组件
