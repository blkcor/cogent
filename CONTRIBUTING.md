# Contributing to Cogent

Thank you for your interest in contributing to Cogent!

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cogent.git
cd cogent
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

Create a `.env` file with your API keys:

```bash
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

4. Run tests:

```bash
pnpm test
```

5. Build the project:

```bash
pnpm build
```

## Development Workflow

1. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and test:

```bash
pnpm test
pnpm typecheck
pnpm lint
```

3. Commit your changes:

```bash
git commit -m "feat: add your feature"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks

## Code Style

- We use Biome for linting and formatting
- Run `pnpm lint:fix` to auto-fix issues
- Run `pnpm format` to format code
- Follow TypeScript best practices
- Add types for all function parameters and returns

## Testing

- Write tests for new features
- Ensure existing tests pass
- Use Vitest for testing
- Integration tests in `tests/`

## Adding New Providers

To add a new LLM provider:

1. Create a provider class in `src/model/providers/`
2. Extend `BaseProvider`
3. Implement `createModel()` method
4. Add to `BUILTIN_PROVIDERS` in `src/model/providers/registry.ts`

## Adding New Tools

To add a new tool:

1. Create tool file in `src/tools/`
2. Define Zod schema for parameters
3. Implement using `createTool()`
4. Export from `src/tools/index.ts`

## Pull Request Process

1. Update README.md if needed
2. Update tests
3. Ensure all checks pass
4. Request review

## Questions?

- Open a discussion on GitHub
- Check existing issues and PRs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

