# Publishing Guide for react-audio-recorder-hook

This document provides instructions for both automated and manual publishing workflows for the `react-audio-recorder-hook` package.

## Automated Publishing

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) for automatic versioning and publishing. The release process is automatically triggered when code is pushed to the `main` or `master` branch.

### How it works

1. When commits are pushed to the main branch, the GitHub Actions workflow runs.
2. If tests and linting pass, semantic-release analyzes the commit messages.
3. Based on the commit messages, it determines the version bump (patch, minor, or major).
4. It automatically updates the version in package.json, creates a changelog entry, and publishes to npm.

### Commit Message Format

For automated releases to work properly, follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

- `fix: message` - for bug fixes (creates a patch release, e.g., 0.1.0 → 0.1.1)
- `feat: message` - for new features (creates a minor release, e.g., 0.1.0 → 0.2.0)
- `feat!: message` or `fix!: message` or commit with `BREAKING CHANGE:` in the footer - creates a major release (e.g., 0.1.0 → 1.0.0)

## Manual Publishing

While automated publishing is recommended, you can publish manually if needed:

### Prerequisites

1. You must have an npm account and be added as a collaborator to the package.
2. You need to be logged in to npm on your local machine.

### Steps for Manual Publishing

1. **Prepare the package**:

```bash
# Install dependencies
pnpm install

# Run linting, tests, and build
pnpm validate
```

2. **Version the package**:

```bash
# Choose one of:
npm version patch  # For bug fixes (0.1.0 → 0.1.1)
npm version minor  # For new features (0.1.0 → 0.2.0)
npm version major  # For breaking changes (0.1.0 → 1.0.0)
```

3. **Publish to npm**:

```bash
npm publish
```

4. **Push changes to GitHub**:

```bash
git push origin main
git push --tags
```

## Publishing a Pre-release Version

For beta or release candidate versions:

```bash
# Version as pre-release
npm version prerelease --preid=beta

# Publish with tag
npm publish --tag beta
```

## Post-Publishing Checklist

After publishing, verify that:

1. The package is available on npm: `npm view react-audio-recorder-hook`
2. The documentation is up-to-date
3. The GitHub repository has the correct tags and releases
4. The package can be installed and used in a new project

## Troubleshooting

If you encounter issues during publishing:

1. Check that your npm authentication is valid: `npm whoami`
2. Verify that you have the correct permissions: `npm access ls-collaborators react-audio-recorder-hook`
3. Check for errors in the npm logs: `npm logs`
