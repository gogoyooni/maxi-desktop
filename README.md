# Maxi Desktop

A beautiful desktop application for the Maxi AI coding agent, powered by MiniMax API.

![Maxi Desktop](screenshot.png)

## Features

- 💬 **Chat Interface** - Beautiful dark-themed chat UI
- 🤖 **AI Coding Agent** - Powered by MiniMax API
- 💡 **Skills System** - Load and use coding skills
- 🔌 **MCP Support** - Connect to MCP servers (Notion, GitHub, Slack, etc.)
- 📎 **File Upload** - Attach files to conversations
- 🌙 **Dark Theme** - Easy on the eyes

## Installation

### Linux

```bash
# Download and extract
unzip Maxi-Desktop-Linux.zip
cd dist

# Install
chmod +x install.sh
./install.sh

# Run
maxi-desktop
```

### From Source

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/maxi-desktop.git
cd maxi-desktop

# Install dependencies
npm install

# Run in development mode
npm start

# Build for distribution
npm run package
```

## Configuration

Maxi Desktop automatically loads:
- **MCP Tokens**: `~/.maxi/tokens/`
- **Skills**: `~/.maxi/skills/`
- **MCP Config**: `~/.maxi/mcp-config.json`

## Connect Services

Within the app, use `/connect` commands:

```
/connect notion   - Connect to Notion
/connect github   - Connect to GitHub
/connect slack    - Connect to Slack
```

Or add MCP servers manually:

```
/mcp add <name> <command>
/mcp start <name>
```

## Skills

Skills extend Maxi's capabilities:

```
/skill list     - List available skills
/skill load     - Load a skill
/load <name>    - Quick load a skill
```

Built-in skills:
- `default` - Base coding instructions
- `debug` - Debugging assistance
- `review` - Code review

## Keyboard Shortcuts

- `Ctrl+H` - Toggle help
- `Ctrl+T` - Toggle file tree
- `Ctrl+M` - Toggle mode (build/plan)
- `Ctrl+L` - Clear screen

## Tech Stack

- **Electron** - Desktop framework
- **MiniMax API** - AI backend
- **MCP Protocol** - Model Context Protocol for tools

## License

MIT

---

Built with ❤️ using Maxi and MiniMax
