# AGENTS.md — EPUB Reader

> 本文件面向 AI 编程助手。如果你对本项目一无所知，请先阅读本文档。

---

## 项目概述

本项目是一个基于 **React + TypeScript + Vite + Tauri 2（Rust）** 的 Windows 桌面 EPUB 阅读器。前端负责 UI 渲染和 epubjs 书籍解析，Rust 后端负责文件存储和数据持久化。

- **前端框架**：React 19 + TypeScript 5.9
- **构建工具**：Vite 7（前端）+ Cargo（Rust）
- **桌面框架**：Tauri 2
- **样式方案**：Tailwind CSS 3 + shadcn/ui（New York 风格）
- **EPUB 引擎**：epubjs 0.3.93
- **动画库**：Framer Motion
- **图标库**：lucide-react

---

## 目录结构

```
├── src/                        # React 前端
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件（由 shadcn CLI 管理）
│   │   ├── Reader.tsx          # 核心阅读器（epubjs 容器 + 翻页交互）
│   │   ├── Home.tsx            # 首页/书架
│   │   ├── TopNav.tsx          # 顶部导航栏
│   │   ├── Toolbar.tsx         # 阅读页工具栏（桌面右侧 + 移动底部）
│   │   ├── TocSidebar.tsx      # 目录侧边栏
│   │   ├── FontSettings.tsx    # 字体设置面板
│   │   ├── ThemeSettings.tsx   # 主题设置面板
│   │   └── ProgressBar.tsx     # 阅读进度条
│   ├── hooks/
│   │   ├── useReader.ts        # 封装 epubjs：加载、渲染、翻页、主题/字体
│   │   ├── useSettings.ts      # 设置/书签/历史持久化（调用 Rust 命令）
│   │   └── use-mobile.ts       # 移动端检测
│   ├── types/index.ts          # 所有 TypeScript 类型定义
│   ├── lib/utils.ts            # cn 工具函数
│   ├── App.tsx                 # 根组件，协调视图状态
│   └── main.tsx                # React 入口
├── src-tauri/                  # Rust 后端
│   ├── src/
│   │   ├── commands.rs         # 所有 Tauri 命令实现
│   │   ├── storage.rs          # 书籍文件存储（AppData/books/）
│   │   ├── config.rs           # JSON 配置读写（设置/书签/历史）
│   │   └── lib.rs              # Tauri Builder 入口 + 命令注册
│   ├── capabilities/
│   │   └── default.json        # Tauri 权限配置
│   └── tauri.conf.json         # 应用配置（窗口、CSP、bundle）
├── public/fonts/               # 自定义中文字体（~31 MB）
├── index.html
├── vite.config.ts              # Vite 配置（port: 1420，alias: @/ → src/）
└── components.json             # shadcn/ui 配置
```

---

## 开发命令

```bash
npm run tauri:dev    # 启动开发模式（前端 + Rust + 原生窗口）
npm run tauri:build  # 构建 .exe/.msi 安装包
npm run build        # 仅构建前端
npm run lint         # ESLint 检查
```

> 项目**没有测试框架**，无 Jest/Vitest/Playwright 配置文件。

---

## 关键数据流

### 加载新书籍

1. 用户点击上传 → `open()`（tauri-plugin-dialog）返回文件路径
2. `invoke('save_book_file', { id, sourcePath })` → Rust 复制文件到 `AppData/books/{id}.epub`
3. `invoke('read_book_bytes', { id })` → Rust 读取文件，返回 `number[]`
4. 前端转为 `ArrayBuffer` → `ePub(arrayBuffer)` → epubjs 解析
5. `setCurrentView('reader')` 进入阅读视图
6. `Reader.tsx` 的 `useEffect` 触发 `onRender(containerRef.current)`
7. `renderTo()` 创建 epubjs `Rendition`，注入字体/主题 CSS，调用 `display(0)`

### 持久化

- 设置/书签/历史通过 `invoke('save_settings'/'save_bookmarks'/'save_history')` 写入 AppData JSON
- 书籍文件永久保存在 AppData/books/，删除书籍时调用 `invoke('delete_book_file')`

---

## Rust ↔ TypeScript 接口约定

Rust 所有结构体使用 `#[serde(rename_all = "camelCase")]`，因此序列化后的 JSON key 是驼峰格式（`fontSize`、`lastReadAt` 等），与前端 TypeScript 类型直接对应。

**不要**在前端写 snake_case 字段名（如 `font_size`、`last_read_at`），也不需要任何桥接转换函数。

前端向 Rust 传递可选字段时，将 TypeScript 的 `undefined` 转为 `null`（Rust 的 `Option<T>` 期望 `null` 而非缺失字段）。

---

## 核心 Tauri 命令

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `save_book_file` | `id: string, sourcePath: string` | `string`（stored path） | 复制 EPUB 到 AppData |
| `read_book_bytes` | `id: string` | `number[]` | 读取 EPUB 字节 |
| `delete_book_file` | `id: string` | `void` | 删除书籍文件 |
| `get_book_file_path` | `id: string` | `string` | 获取存储路径 |
| `load_settings` | — | `ReaderSettings` | 读取设置 |
| `save_settings` | `settings: ReaderSettings` | `void` | 保存设置 |
| `load_bookmarks` | — | `Bookmark[]` | 读取书签 |
| `save_bookmarks` | `bookmarks: Bookmark[]` | `void` | 保存书签 |
| `load_history` | — | `ReadingHistory[]` | 读取历史 |
| `save_history` | `history: ReadingHistory[]` | `void` | 保存历史 |

新增命令需同时：① 在 `commands.rs` 实现；② 在 `lib.rs` 的 `invoke_handler![]` 中注册。

---

## 已知设计决策与陷阱

| 场景 | 决策 | 原因 |
|------|------|------|
| epubjs 加载方式 | 传 `ArrayBuffer`，不传 URL | Tauri WebView2 的 blob:// fetch 会无限挂起 |
| asset 协议 | 未使用 `convertFileSrc` | 需要额外 capabilities scope 配置，已改为 read_book_bytes |
| 设置序列化 | 直接用 TS 类型，不写桥接层 | Rust `rename_all = "camelCase"` 与 TS 类型天然对应 |
| `useCallback` 顺序 | 被引用的函数必须先声明 | `const` TDZ 问题：依赖数组在声明前求值会抛 ReferenceError |
| 字体注入 | 通过 `rendition.hooks.content.register()` | epubjs 每章节加载都在新 iframe 中，必须用 hook 重新注入 |

---

## 代码规范

- 组件：PascalCase（`Reader.tsx`）；Hooks：camelCase + `use` 前缀（`useReader.ts`）
- TypeScript 严格模式：`strict`、`noUnusedLocals`、`noUnusedParameters`、`erasableSyntaxOnly`
- 动画：Framer Motion，缓动函数 `[0.4, 0, 0.2, 1]`
- 移动端断点 768px，响应式工具栏（桌面右侧 / 移动底部）
- 修改 UI 前先查 `src/components/ui/` 是否有现成 shadcn 组件
- 默认不写注释；仅在行为非显而易见时写一行说明
