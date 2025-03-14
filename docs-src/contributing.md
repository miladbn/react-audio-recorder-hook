# Contributing to React Audio Recorder Hook

Thank you for considering contributing to React Audio Recorder Hook! This document outlines the process for contributing to the project and the standards we expect.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct, which promotes a respectful and inclusive environment for everyone involved.

## How to Contribute

### Reporting Bugs

1. Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/miladbn/react-audio-recorder-hook/issues)
2. If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/miladbn/react-audio-recorder-hook/issues/new)
3. Include:
   - A clear title and description
   - Steps to reproduce the bug
   - Expected behavior
   - Actual behavior
   - Browser and OS information
   - Code samples or screenshots if applicable

### Suggesting Enhancements

1. [Open a new issue](https://github.com/miladbn/react-audio-recorder-hook/issues/new) with the "enhancement" label
2. Clearly describe the enhancement and its benefits
3. Provide examples of how the enhancement would work in practice

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests and ensure they pass: `npm test`
5. Make sure your code lints: `npm run lint`
6. Update documentation if necessary
7. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/): `feat: add new feature`
8. Push to your branch: `git push origin feature/your-feature-name`
9. [Submit a pull request](https://github.com/miladbn/react-audio-recorder-hook/compare)

## Development Workflow

### Setup

1. Clone your fork: `git clone https://github.com/your-username/react-audio-recorder-hook.git`
2. Install dependencies: `npm install`

### Development

1. Run tests in watch mode: `npm run test:watch`
2. Run linting: `npm run lint`
3. Format code: `npm run format`

### Testing

We use Vitest for testing. All new features should include tests. To run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Style

We follow [ESLint](https://eslint.org/) rules defined in `.eslintrc.js` and [Prettier](https://prettier.io/) formatting defined in `.prettierrc`. Before submitting a PR:

1. Format your code: `npm run format`
2. Fix lint errors: `npm run lint`

## TypeScript Conventions

- Use interfaces instead of types for public APIs
- Add JSDoc comments for all public interfaces and functions
- Use precise types rather than `any`
- Follow functional programming patterns where possible

Example:

```typescript
/**
 * Configuration options for the audio recorder
 */
export interface AudioRecorderOptions {
  /** Audio constraints to pass to getUserMedia */
  audioConstraints?: MediaTrackConstraints;
  /** Recording data chunk interval in milliseconds */
  chunkInterval?: number;
}

/**
 * A hook for recording audio in React applications
 * @param options Configuration options for the audio recorder
 * @returns An object containing functions and state for controlling audio recording
 */
export function useAudioRecorder(options?: AudioRecorderOptions): UseAudioRecorderReturn {
  // Implementation
}
```

## Git Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Changes to the build process or tools

Examples:

```
feat: add support for MP3 format
fix: resolve issue with playback in Safari
docs: update API documentation
```

## Release Process

We use [semantic-release](https://github.com/semantic-release/semantic-release) to automate our release process. Version numbers are automatically determined based on commit messages:

- Breaking changes (`BREAKING CHANGE:` in commit message) trigger a major version bump
- Features (`feat:`) trigger a minor version bump
- Fixes (`fix:`) trigger a patch version bump

## Questions?

If you have any questions about contributing, please [open an issue](https://github.com/miladbn/react-audio-recorder-hook/issues/new) and we'll be happy to help.
