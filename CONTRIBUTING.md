# Contributing to nextjs-saaskit

Thank you for your interest in contributing to nextjs-saaskit! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Issues

- Use the GitHub issue tracker
- Provide clear descriptions and steps to reproduce
- Include relevant environment information
- Check for existing issues before creating new ones

### Suggesting Features

- Open an issue with the "enhancement" label
- Describe the use case and expected behavior
- Discuss the proposal before implementing

### Contributing Code

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/nextjs-saaskit.git
   cd nextjs-saaskit
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   Commit message format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `chore:` for maintenance tasks
   - `refactor:` for code refactoring

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description
   - Reference related issues
   - Wait for review and feedback

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Set up the database:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Code Style Guidelines

- Use TypeScript for type safety
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small
- Write self-documenting code

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test edge cases and error handling

## Documentation

- Update README.md for user-facing changes
- Update CHANGELOG.md for notable changes
- Add JSDoc comments for new functions
- Keep inline comments clear and helpful

## Pull Request Process

1. Ensure your code follows the style guidelines
2. Make sure all tests pass
3. Update documentation as needed
4. Request review from maintainers
5. Address feedback and make requested changes
6. Once approved, maintainers will merge your PR

## Questions?

If you have questions or need help:
- Open an issue on GitHub
- Check existing documentation
- Review closed issues and PRs

Thank you for contributing to nextjs-saaskit! 🎉

