# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

基于 **React 19 + TypeScript + Vite + Tauri 2（Rust）** 的 Windows 桌面 EPUB 阅读器。前端使用 React + epubjs 渲染书籍，后端使用 Rust 处理文件存储、设置持久化。界面语言为简体中文。

## 开发命令

```bash
npm run tauri:dev    # 启动 Tauri 开发模式（前端 + Rust 后端 + 原生窗口）
npm run tauri:build  # 构建生产安装包（输出 .exe/.msi 至 src-tauri/target/release/bundle/）
npm run build        # 仅构建前端（tsc -b && vite build）
npm run lint         # ESLint 检查
npm run preview      # 预览前端生产构建
```

项目未配置测试框架（无 Vitest/Jest/Playwright），也无 Prettier 配置。Vite 开发服务器固定端口 **1420**（Tauri devUrl）。

## 架构

### 前后端分工

**Rust 后端**（`src-tauri/src/`）：
- `commands.rs` — Tauri 命令：`save_book_file`、`read_book_bytes`、`delete_book_file`、`get_book_file_path`、`load/save_settings`、`load/save_bookmarks`、`load/save_history`、`get_app_data_dir`
- `storage.rs` — 书籍文件存储到 AppData（`books/` 子目录），按 `{id}.epub` 命名
- `config.rs` — 设置/书签/历史序列化为 JSON，存储到 AppData 根目录；所有结构体使用 `#[serde(rename_all = "camelCase")]`
- `lib.rs` — Tauri Builder 入口，注册所有命令和插件

**React 前端**（`src/`）：

- **`App.tsx`** — 全局状态协调者。管理 `currentView`（`'home'`|`'reader'`）、`currentBookId` 以及侧边栏/弹窗的开关状态。无路由，视图切换完全由状态驱动。

- **`useReader`**（`src/hooks/useReader.ts`）— 封装所有 epubjs 交互。使用 `bookRef`/`renditionRef`（ref 而非 state，避免重渲染）。`loadBook` 接受 `string | ArrayBuffer`，实际以 `ArrayBuffer` 传入（直接内存解析，绕过 WebView2 fetch 问题）。

- **`useSettings`**（`src/hooks/useSettings.ts`）— 通过 Tauri `invoke` 调用 Rust 命令持久化设置/书签/历史（最多 20 本）。Rust 返回的 JSON key 已是 camelCase，直接映射到 TypeScript 类型，**不需要** snake_case 桥接转换。`getThemeColors()` 返回当前主题的 `{background, text, secondaryBg, border, icon}`。

### 关键数据流

1. 用户选择 EPUB → `open()` 对话框返回文件路径
2. `invoke('save_book_file')` → Rust 将文件复制到 AppData/books/
3. `invoke('read_book_bytes')` → Rust 返回 `Vec<u8>` → 前端转为 `ArrayBuffer`
4. `ePub(arrayBuffer)` → epubjs 直接在内存中解析（不走 fetch）
5. `Reader.tsx` 提供容器 ref → `useReader.renderTo()` → epubjs 渲染到 iframe
6. 翻页触发 epubjs `relocated` 事件 → 更新位置/进度状态
7. 设置变更通过 `useEffect` 同步到 Rendition，并 `invoke('save_*')` 持久化到 AppData JSON

### 关键架构细节

- epubjs 使用 `ArrayBuffer` 而非 URL 加载——Tauri WebView2 的 `blob://` URL fetch 会无限挂起
- Rust 所有结构体使用 `rename_all = "camelCase"`，前端直接用 TypeScript 类型接收，**不要**做 snake_case 转换
- 自定义中文字体通过 `rendition.hooks.content.register()` 注入到 epubjs 的 iframe 中
- 滚轮/键盘翻页节流 300ms
- `themeColors` 对象通过 props 逐层传递，未使用 React Context
- 强调色 `#4a9eff` 在全局硬编码（未使用 CSS 变量）

## 关键路径

- `src/types/index.ts` — 所有 TypeScript 接口（集中定义）
- `src/components/ui/` — shadcn/ui 组件（通过 shadcn CLI 管理）
- `public/fonts/` — 自定义中文字体文件（约 31 MB）
- `src-tauri/capabilities/default.json` — Tauri 权限配置（fs scope、dialog、asset protocol）
- `src-tauri/tauri.conf.json` — 应用配置（窗口大小、CSP、bundle 目标）
- 路径别名：`@/` → `src/`（在 `vite.config.ts` 和 `tsconfig.json` 中配置）

## 代码规范

- 组件：PascalCase 文件名（`Reader.tsx`、`FontSettings.tsx`）
- Hooks：camelCase，以 `use` 开头（`useReader.ts`、`useSettings.ts`）
- TypeScript 严格模式，启用 `noUnusedLocals`、`noUnusedParameters`、`erasableSyntaxOnly`
- 动画统一使用 Framer Motion，缓动函数 `[0.4, 0, 0.2, 1]`
- 移动端断点 768px；工具栏在桌面端为右侧栏，移动端为底部栏
- 修改 UI 时，先检查 `src/components/ui/` 是否已有可用的 shadcn 组件

## 常见陷阱

- 新增 Tauri 命令必须同时在 `commands.rs` 实现**并**在 `lib.rs` 的 `invoke_handler` 中注册
- Rust 序列化已用 `rename_all = "camelCase"`，前端**不要**再写 snake_case 字段名
- epubjs 不能从 Tauri asset URL 加载（WebView2 fetch 挂起），始终用 `ArrayBuffer`
- `useCallback` 依赖数组中引用的函数必须在该 callback **之前**声明，否则触发 TDZ 错误
