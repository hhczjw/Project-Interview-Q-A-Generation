#!/bin/bash
# 按照项目生成简历 Skill — 一键部署脚本
# 将适配文件部署到各 AI Coding 工具的配置目录

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ADAPTERS_DIR="$PROJECT_DIR/src/adapters"

echo "🚀 按照项目生成简历 Skill — 部署工具"
echo "======================================"
echo ""

# 部署 Claude Code
deploy_claude_code() {
  local target_dir="$1/.claude"
  mkdir -p "$target_dir/commands"
  cp "$ADAPTERS_DIR/claude-code/skill.md" "$target_dir/commands/generate-resume.md"
  cp "$ADAPTERS_DIR/claude-code/skill-interview.md" "$target_dir/commands/generate-interview.md"
  echo "  ✅ Claude Code Commands 已部署到 $target_dir/commands/"
  echo "     使用: /project:generate-resume 或 /project:generate-interview"
}

# 部署 Cursor
deploy_cursor() {
  local target_dir="$1"
  cp "$ADAPTERS_DIR/cursor/.cursorrules" "$target_dir/.cursorrules"
  echo "  ✅ Cursor Rules 已部署到 $target_dir/.cursorrules"
}

# 部署 Windsurf
deploy_windsurf() {
  local target_dir="$1"
  cp "$ADAPTERS_DIR/windsurf/.windsurfrules" "$target_dir/.windsurfrules"
  echo "  ✅ Windsurf Rules 已部署到 $target_dir/.windsurfrules"
}

# 部署 GitHub Copilot
deploy_copilot() {
  local target_dir="$1/.github"
  mkdir -p "$target_dir"
  cp "$ADAPTERS_DIR/copilot/copilot-instructions.md" "$target_dir/copilot-instructions.md"
  echo "  ✅ Copilot Instructions 已部署到 $target_dir/copilot-instructions.md"
}

# 部署 Trae
deploy_trae() {
  local target_dir="$1"
  # Trae 使用自定义规则文件
  cp "$ADAPTERS_DIR/trae/trae-rules.md" "$target_dir/.trae-rules.md"
  echo "  ✅ Trae Rules 已部署到 $target_dir/.trae-rules.md"
}

# 主菜单
echo "请选择部署目标："
echo ""
echo "  1) 部署到当前项目目录"
echo "  2) 部署到用户主目录（全局生效）"
echo "  3) 仅部署 Claude Code"
echo "  4) 仅部署 Cursor"
echo "  5) 仅部署 Windsurf"
echo "  6) 仅部署 GitHub Copilot"
echo "  7) 仅部署 Trae"
echo "  8) 全部部署"
echo ""
read -p "请输入选项 [1-8]: " choice

case $choice in
  1)
    TARGET_DIR="."
    echo ""
    echo "📁 部署到当前项目目录: $(pwd)"
    echo ""
    deploy_claude_code "$TARGET_DIR"
    deploy_cursor "$TARGET_DIR"
    deploy_windsurf "$TARGET_DIR"
    deploy_copilot "$TARGET_DIR"
    deploy_trae "$TARGET_DIR"
    ;;
  2)
    TARGET_DIR="$HOME"
    echo ""
    echo "📁 部署到用户主目录: $TARGET_DIR"
    echo ""
    deploy_claude_code "$TARGET_DIR"
    deploy_cursor "$TARGET_DIR"
    deploy_windsurf "$TARGET_DIR"
    deploy_copilot "$TARGET_DIR"
    deploy_trae "$TARGET_DIR"
    ;;
  3)
    read -p "目标目录 [当前目录]: " dir
    deploy_claude_code "${dir:-.}"
    ;;
  4)
    read -p "目标目录 [当前目录]: " dir
    deploy_cursor "${dir:-.}"
    ;;
  5)
    read -p "目标目录 [当前目录]: " dir
    deploy_windsurf "${dir:-.}"
    ;;
  6)
    read -p "目标目录 [当前目录]: " dir
    deploy_copilot "${dir:-.}"
    ;;
  7)
    read -p "目标目录 [当前目录]: " dir
    deploy_trae "${dir:-.}"
    ;;
  8)
    read -p "目标目录 [当前目录]: " dir
    TARGET_DIR="${dir:-.}"
    echo ""
    echo "📁 部署到: $TARGET_DIR"
    echo ""
    deploy_claude_code "$TARGET_DIR"
    deploy_cursor "$TARGET_DIR"
    deploy_windsurf "$TARGET_DIR"
    deploy_copilot "$TARGET_DIR"
    deploy_trae "$TARGET_DIR"
    ;;
  *)
    echo "❌ 无效选项"
    exit 1
    ;;
esac

echo ""
echo "🎉 部署完成！"
echo ""
echo "使用方式："
echo "  - Claude Code（项目级）: /project:generate-resume 或 /project:generate-interview"
echo "  - Claude Code（全局）:   /user:generate-resume 或 /user:generate-interview"
echo "  - Cursor: 在对话中说 '生成简历' 或 '准备面试'"
echo "  - Windsurf: 在对话中说 '生成简历' 或 '准备面试'"
echo "  - Copilot: 在对话中说 '生成简历' 或 '准备面试'"
echo "  - Trae: 在对话中说 '生成简历' 或 '准备面试'"
