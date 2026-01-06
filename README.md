# Cogent - AI Coding Assistant

An AI-powered coding agent with advanced reasoning capabilities, supporting 15+ LLM providers and multiple reasoning strategies.

## Features

- 🧠 **Multiple Reasoning Modes**: ReAct, Plan-and-Solve, and Reflection
- 🔌 **Multi-Provider Support**: OpenAI, Anthropic, Google, DeepSeek, OpenRouter, and more
- 🛠️ **Rich Tool System**: Read, write, edit files, execute commands, search code
- 💾 **Memory Systems**: Short-term conversation memory and long-term episodic/semantic memory
- 🔒 **Security Controls**: Sandbox execution, approval modes, command validation
- 📊 **Token Management**: Intelligent context management within token budgets

## Installation

```bash
npm install -g cogent
# or
pnpm add -g cogent
```

## Quick Start

1. Initialize Cogent:

```bash
cogent init
```

2. Set up API keys in `.env`:

```bash
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
# Add other provider keys as needed
```

3. Use Cogent:

**Interactive REPL Mode (default):**
```bash
cogent
```
This enters an interactive shell where you can type tasks and get immediate responses.

**Single Task Execution:**
```bash
cogent run "Create a REST API with Express and TypeScript"
```

### Interactive REPL Mode

Run `cogent` without arguments to enter interactive REPL (Read-Eval-Print Loop) mode:

```bash
cogent
```

In REPL mode, you can:
- 💬 **Chat continuously** with the agent
- 🔄 **Execute multiple tasks** in one session
- 📝 **See command history** as you work
- ⚡ **Quick iteration** without restarting

**REPL Commands:**
- Type any coding task and press Enter to execute
- Type `clear` to clear the screen
- Type `exit` or `quit` to leave REPL mode
- Press `Ctrl+C` to exit

### Terminal UI

Cogent features a beautiful Terminal User Interface (TUI) that provides:

- 🎨 **Colorful output** with status indicators
- ⚡ **Real-time streaming** of agent thoughts and actions
- 📋 **Step-by-step progress** tracking
- 🔍 **Tool call visualization** with parameters and results
- 💭 **Reasoning display** showing agent decision-making

The TUI is enabled by default. To use simple console output instead:

```bash
cogent run "your task" --no-ui
```

## Configuration

Cogent uses a `.cogent.json` file for configuration:

```json
{
  "model": "anthropic/claude-3-5-sonnet-20241022",
  "reasoning": {
    "defaultMode": "react",
    "maxSteps": 30
  },
  "security": {
    "approvalMode": "default",
    "sandboxEnabled": true
  }
}
```

### Approval Modes

- `strict`: Approve every action
- `default`: Auto-approve reads, confirm writes/commands
- `auto_edit`: Auto-approve all file operations
- `yolo`: Auto-approve everything (use with caution!)

## Supported Providers

### Major Providers
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
- Google (Gemini Pro, Gemini Flash)
- xAI (Grok)

### Aggregators
- OpenRouter (50+ models)
- AIHubMix

### Regional (China)
- DeepSeek
- Moonshot/Kimi
- Zhipu AI
- SiliconFlow

See all providers: `cogent models`

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format

# Type check
pnpm typecheck
```

## Architecture

Cogent follows a modular architecture with:

- **Multi-Provider System**: Supports 12+ LLM providers out of the box
- **Tool System**: Extensible tool framework with Zod validation
- **Security**: Command validation, approval workflows, backup system
- **Context Management**: Token-aware context with priority-based retention

## License

MIT

## Status

🚧 **Work in Progress** - v1.0.0 in active development

