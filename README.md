# ComfyUI Image Viewer

ComfyUI用のフルスクリーンプレビュー機能を提供するカスタムノード拡張です。画像生成中でもリアルタイムでフルスクリーンプレビューを楽しめます。

## 特徴

- 🖼️ **リアルタイムプレビュー**: 画像生成中でもリアルタイムで結果を確認
- 🔍 **フルスクリーンビュー**: サムネイルをクリックしてフルスクリーンで画像を表示
- 🎯 **ノンブロッキング**: 画像をそのまま次のノードに渡すため、ワークフローを妨げません
- 🏷️ **タグ機能**: 複数のプレビューノードを同時に使用可能
- 🎨 **美しいUI**: 角丸サムネイルと半透明オーバーレイ

## インストール

### 方法1: 手動インストール

1. このリポジトリをComfyUIの`custom_nodes`ディレクトリにクローンします：

```bash
cd /path/to/ComfyUI/custom_nodes/
git clone https://github.com/your-username/comfyui-imageviewer.git
```

2. ComfyUIを再起動します。

### 方法2: ファイルコピー

1. プロジェクトファイルをダウンロード
2. `comfyui-imageviewer`フォルダ全体を`ComfyUI/custom_nodes/`に配置
3. ComfyUIを再起動

## 使い方

### 基本的な使用方法

1. ComfyUIのノードメニューから `preview > Fullscreen Preview` ノードを追加
2. 画像出力ノード（VAE Decode等）の出力を`Fullscreen Preview`の`images`入力に接続
3. 必要に応じて`tag`パラメータを設定（複数のプレビューを使う場合）
4. ワークフローを実行

### サムネイルからフルスクリーン表示

- ノードの左下に表示される小さなサムネイルをクリック
- フルスクリーン表示が開き、オーバーレイ上のどこかをクリックで閉じる
- 生成が進むにつれて、フルスクリーン画像もリアルタイムで更新

### 複数プレビューの使用

```
┌─────────────┐    ┌─────────────────────┐
│  VAE Decode │────│ Fullscreen Preview  │
└─────────────┘    │ tag: "main"         │
                   └─────────────────────┘

┌─────────────┐    ┌─────────────────────┐
│ Upscaling   │────│ Fullscreen Preview  │
└─────────────┘    │ tag: "upscaled"     │
                   └─────────────────────┘
```

## ノード詳細

### Fullscreen Preview

**入力:**
- `images` (IMAGE): プレビューする画像データ（バッチ対応）
- `tag` (STRING): 識別用タグ（デフォルト: "preview1"）

**出力:**
- `images_out` (IMAGE): 入力画像をそのまま通過

**機能:**
- バッチの最初の画像をプレビュー対象として使用
- 画像をPNG形式のBase64データに変換してフロントエンドに送信
- サムネイル表示とフルスクリーン表示の両方をサポート

## 技術仕様

### ファイル構成

```
comfyui-imageviewer/
├── __init__.py                 # ComfyUIノード登録
├── README.md                   # このファイル
├── src/
│   └── nodes.py               # FullscreenPreviewノード実装
└── web/
    └── js/
        └── fullscreen_preview.js  # フロントエンド拡張
```

### 依存関係

- **Python**: torch, numpy, PIL (Pillow)
- **ComfyUI**: server.PromptServer
- **フロントエンド**: ComfyUI標準のLiteGraphライブラリ

### 通信プロトコル

PythonバックエンドとJavaScriptフロントエンド間で以下のイベントメッセージを使用：

```javascript
// イベント名: "custom.fullscreenpreview.update"
{
  "tag": "preview1",           // 識別用タグ
  "image": "iVBORw0KGgoAAAA..." // Base64エンコードされたPNGデータ
}
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

バグ報告、機能リクエスト、プルリクエストを歓迎します。

## トラブルシューティング

### ノードが表示されない
- ComfyUIを再起動してください
- `custom_nodes`ディレクトリの配置を確認してください

### プレビューが更新されない
- コンソールでJavaScriptエラーがないか確認してください
- ノードの`tag`値が正しく設定されているか確認してください

### フルスクリーン表示が動作しない
- サムネイル領域（ノード左下）を正確にクリックしているか確認してください
- ブラウザの開発者コンソールでエラーをチェックしてください