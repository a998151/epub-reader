# AGENTS.md — EPUB Reader

> 本文件面向 AI 编程助手。如果你对本项目一无所知，请先阅读本文档。

---

## 项目概述

本项目是一个基于 **React + TypeScript + Vite** 的网页版 EPUB 阅读器，位于 `app/` 目录下。用户可以通过文件上传或拖拽的方式加载 `.epub` 书籍，应用会在浏览器中解析并渲染书籍内容，提供目录导航、字体/主题设置、书签、阅读进度追踪和阅读历史（书架）等功能。

- **项目名称**：EPUB Reader（my-app）
- **前端框架**：React 19 + TypeScript 5.9
- **构建工具**：Vite 7.2.4
- **样式方案**：Tailwind CSS 3.4.19 + shadcn/ui（New York 风格）
- **EPUB 引擎**：epubjs
- **动画库**：Framer Motion
- **图标库**：lucide-react
- **Node 版本**：Node.js 20（参考 `info.md`）

> 注意：根目录下还有一个 `app_old/` 文件夹，仅包含旧版的 `package.json`，属于遗留目录，不在当前维护范围内。

---

## 目录结构

```
app/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui 组件（由 shadcn 管理）
│   │   ├── Reader.tsx       # 核心阅读器（渲染 epubjs + 拖拽上传）
│   │   ├── Home.tsx         # 首页/书架（阅读历史与书籍展示）
│   │   ├── TopNav.tsx       # 顶部导航栏
│   │   ├── Toolbar.tsx      # 阅读页右侧工具栏（桌面）+ 底部工具栏（移动端）
│   │   ├── TocSidebar.tsx   # 目录侧边栏
│   │   ├── FontSettings.tsx # 字体设置弹窗
│   │   ├── ThemeSettings.tsx# 主题设置弹窗
│   │   └── ProgressBar.tsx  # 阅读进度条
│   ├── hooks/
│   │   ├── useReader.ts     # 封装 epubjs 的书籍加载、渲染、翻页、主题/字体应用
│   │   ├── useSettings.ts   # 阅读设置、书签、阅读历史的持久化（localStorage）
│   │   └── use-mobile.ts    # 判断是否为移动端的 hook
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   ├── lib/
│   │   └── utils.ts         # cn 工具函数（clsx + tailwind-merge）
│   ├── App.tsx              # 根组件，协调视图状态（home / reader）
│   ├── main.tsx             # React 入口
│   ├── index.css            # 全局样式 + Tailwind + CSS 变量
│   └── App.css              # 应用级样式
├── dist/                    # Vite 构建输出（已包含预构建的静态文件）
├── index.html               # HTML 入口
├── vite.config.ts           # Vite 配置（base: './', alias: '@' → './src'）
├── tsconfig.json            # TypeScript 工程引用配置
├── tsconfig.app.json        # 应用侧 TS 配置（strict, ES2022, bundler）
├── tsconfig.node.json       # Node 侧 TS 配置（vite.config.ts）
├── tailwind.config.js       # Tailwind 主题扩展（shadcn 变量、动画 keyframes）
├── postcss.config.js        # PostCSS（tailwindcss + autoprefixer）
├── eslint.config.js         # ESLint 配置（js + ts + react-hooks + react-refresh）
├── components.json          # shadcn/ui 配置文件
├── package.json
└── README.md / info.md / tech-spec.md  # 项目文档
```

---

## 技术栈详情

### 核心依赖
- **react / react-dom**：^19.2.0
- **epubjs**：^0.3.93（EPUB 解析与渲染）
- **framer-motion**：^12.38.0（页面过渡、弹窗动画、交互动画）
- **lucide-react**：^0.562.0（图标）
- **next-themes**：^0.4.6（主题相关）
- **sonner**：^2.0.7（Toast 提示）
- **zod**：^4.3.5（类型校验，目前主要在表单相关依赖链中）

### shadcn/ui 与 Radix
项目通过 shadcn/ui 引入了 40+ 基于 Radix 的组件（`button`, `slider`, `sheet`, `popover`, `tooltip`, `scroll-area` 等），存放在 `src/components/ui/`。新增 shadcn 组件建议使用官方 CLI 安装，以保持风格一致。

### 样式系统
- **Tailwind CSS** 使用 `darkMode: ["class"]` 策略，结合 CSS 变量实现主题切换。
- 颜色变量定义在 `src/index.css` 的 `:root` 与 `.dark` 中，并在 `tailwind.config.js` 中映射为 `border`, `background`, `foreground`, `primary`, `secondary` 等。
- 应用还维护了一套自定义主题颜色（`light` / `dark` / `sepia`），通过 `useSettings` 的 `getThemeColors()` 返回具体色值，动态注入到组件 `style` 和 epubjs `themes` 中。

---

## 构建与开发命令

所有命令均在 `app/` 目录下执行：

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查并构建生产包（输出到 dist/）
npm run build

# 预览生产构建
npm run preview

# 运行 ESLint 检查
npm run lint
```

> 当前项目 **没有配置测试框架**（无 Jest/Vitest/Cypress/Playwright），也找不到任何 `.test.*` 或 `.spec.*` 文件。

---

## 代码组织与模块划分

### 状态管理
- 无 Redux / Zustand，状态通过 **React Hooks** 和 **Props Drilling** 管理。
- `App.tsx` 是唯一的全局状态协调者，维护当前视图（`home` / `reader`）、当前书籍 ID、侧边栏/弹窗开关状态。
- `useReader` 管理 epubjs 实例和阅读器状态（加载、目录、当前位置、进度）。
- `useSettings` 管理用户设置、书签、阅读历史，并同步到 `localStorage`。

### 关键数据流
1. 用户上传 EPUB → `App.tsx` 读取 `ArrayBuffer` → `useReader.loadBook()` → epubjs 解析出 metadata / toc。
2. `App.tsx` 将书籍加入阅读历史（`useSettings.addToHistory`），并存储 `ArrayBuffer` 到 `localStorage`。
3. 进入阅读视图后，`Reader.tsx` 拿到容器 DOM → `App.tsx` 调用 `handleRender()` → `useReader.renderTo()` → epubjs `Rendition` 注入 iframe 渲染内容。
4. 翻页/滚轮/键盘事件触发 `useReader.next()` / `prev()`，epubjs 的 `relocated` 事件更新当前 location 和进度。
5. 设置变更（字体、主题）通过 `useEffect` 同步应用到 `Rendition`。

### 文件命名与组织约定
- 组件文件使用 **PascalCase**（如 `Reader.tsx`）。
- Hook 文件使用 **camelCase** 并以 `use` 开头（如 `useReader.ts`）。
- 类型定义集中在 `src/types/index.ts`，接口使用 **PascalCase**。
- 工具函数放在 `src/lib/utils.ts`。
- 路径别名统一使用 `@/` 指向 `src/`（由 `vite.config.ts` 和 `tsconfig.json` 共同配置）。

---

## 开发规范与代码风格

### TypeScript
- **严格模式已开启**（`strict: true`），并启用了以下额外检查：
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `erasableSyntaxOnly: true`
  - `noFallthroughCasesInSwitch: true`
  - `noUncheckedSideEffectImports: true`
- 目标版本为 `ES2022`，模块系统为 `ESNext`，使用 `bundler` 模块解析策略。
- 允许直接导入 `.ts` / `.tsx` 扩展名（`allowImportingTsExtensions: true`）。

### ESLint
- 配置位于 `eslint.config.js`，使用 Flat Config 格式。
- 规则集包括：
  - `@eslint/js`（recommended）
  - `typescript-eslint`（recommended）
  - `eslint-plugin-react-hooks`（recommended）
  - `eslint-plugin-react-refresh`（vite 预设）
- 忽略目录：`dist/`。

### 样式与 UI
- 优先使用 Tailwind 工具类，复杂动态样式（尤其是主题相关）使用内联 `style`。
- shadcn/ui 组件样式以 `className` 组合为主，修改 shadcn 组件时请保持其内部结构，避免破坏 Radix 行为。
- 动画交互统一使用 `framer-motion`，保持缓动函数一致（如 `[0.4, 0, 0.2, 1]`）。
- 响应式断点遵循 Tailwind 默认值：`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`。

---

## 测试策略

- **目前项目没有任何自动化测试。**
- 如果你需要添加测试，建议：
  - 单元测试：使用 **Vitest**（与 Vite 生态集成最好）。
  - 组件测试：可配合 **React Testing Library**。
  - E2E 测试：可考虑 **Playwright**（测试 epubjs 在真实浏览器中的渲染行为）。
- 测试文件建议放在 `src/` 同级或 `__tests__/` 目录，命名遵循 `*.test.ts` / `*.spec.ts`。

---

## 安全与性能注意事项

### 安全
- **localStorage 存储完整 EPUB 文件**：`useSettings` 将书籍的 `ArrayBuffer` 以 Base64 或二进制形式序列化后存入 `localStorage`，最大保留 20 本书。
  - 风险：`localStorage` 通常有 5–10 MB 限制，大体积 EPUB 可能导致存储溢出或性能下降。
  - 建议：如需扩容，可迁移到 **IndexedDB**（如 `localforage`）。
- 应用完全在客户端运行，不涉及后端 API、身份验证或 CORS 代理（除非 epubjs 内部加载远程资源）。
- 对用户上传的文件仅做 `.epub` 后缀检查，没有进一步的文件内容校验。

### 性能
- `useReader` 在加载书籍后使用 `setTimeout` 延迟生成 `locations`（chunk size 512），避免阻塞首屏渲染。
- `Reader.tsx` 的滚轮翻页和键盘事件都做了节流（throttle，300ms），防止快速连续触发。
- 项目没有启用 React Compiler（参考 `README.md`），如需进一步优化渲染，可考虑开启。

---

## 部署流程

- 构建产物为纯静态文件，输出到 `app/dist/`。
- `vite.config.ts` 中设置了 `base: './'`，因此构建后的资源使用相对路径，可直接部署到任意静态托管服务（如 GitHub Pages、Vercel、Netlify、Nginx）。
- 当前仓库中 **没有 CI/CD 配置文件**（无 `.github/workflows`、无 Dockerfile）。

---

## 给 AI 助手的快速参考

- 修改 UI 组件时，先在 `src/components/ui/` 查找是否已有现成的 shadcn 组件。
- 修改阅读器逻辑时，重点关注 `src/hooks/useReader.ts` 和 `src/App.tsx`。
- 修改设置/历史/书签逻辑时，重点关注 `src/hooks/useSettings.ts`。
- 新增路由/页面暂不需要，当前为单视图应用（`home` ↔ `reader`）。
- 不要在 `app_old/` 中做任何修改。
