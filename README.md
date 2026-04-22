# EPUB Reader

基于 **React + TypeScript + Vite + Electron** 的跨平台 EPUB 阅读器。

## 功能特性

- 📖 支持本地 EPUB 文件上传与拖拽打开
- 📝 目录导航与章节跳转
- 🔖 书签管理
- 📚 阅读历史（书架）
- ⚙️ 阅读设置：字体、字号、行间距、内容宽度、主题
- 🌗 多种主题：浅色、深色、护眼绿、深蓝等
- 🖥️ Windows 桌面应用安装包

## 技术栈

- React 19 + TypeScript 5.9
- Vite 7
- Tailwind CSS + shadcn/ui
- epubjs
- Electron + electron-builder

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查并构建前端（输出到 dist/）
npm run build

# 预览生产构建
npm run preview

# 运行 ESLint 检查
npm run lint
```

## 打包构建

### 构建 Windows 安装包

```bash
npm run dist
```

构建完成后，输出文件位于：

- `release/EPUB Reader Setup 0.0.0.exe` — Windows 安装包（双击安装）
- `release/win-unpacked/EPUB Reader.exe` — 免安装版（可直接运行）

### 仅构建前端静态文件

```bash
npm run build
```

构建产物输出到 `dist/` 目录，可部署到任意静态托管服务。

## 自定义应用图标

如需自定义桌面应用图标，修改 `package.json` 中的 `build` 配置：

```json
"build": {
  "win": {
    "icon": "path/to/icon.ico"
  }
}
```

然后重新运行 `npm run dist`。
