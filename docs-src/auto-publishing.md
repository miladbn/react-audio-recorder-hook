# Automatic NPM Publishing Guide

This guide explains how the automatic publishing system works for `react-audio-recorder-hook` and how to maintain it.

## Overview

The package uses [semantic-release](https://github.com/semantic-release/semantic-release) with GitHub Actions to automate the release process. When code is pushed to the main branch, the system will:

1. Run tests to ensure everything is working
2. Analyze commit messages to determine the next version number
3. Generate release notes
4. Update the CHANGELOG.md file
5. Publish the package to npm
6. Create a GitHub release

## Setup Requirements

To make the automatic publishing work, you need to:

### 1. Add NPM Token to GitHub Secrets

1. Log in to your npm account and generate an access token:

   - Go to npmjs.com and log in
   - Click on your profile icon → "Access Tokens"
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" for token type
   - Copy the generated token

2. Add the token to GitHub repository secrets:
   - Go to your GitHub repository
   - Navigate to "Settings" → "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

### 2. Ensure Your Package.json is Configured Correctly

Your package.json should have:

```json
{
  "name": "react-audio-recorder-hook",
  "version": "0.1.0",
  "publishConfig": {
    "access": "public"
  }
}
```

The `publishConfig` field ensures the package is published with the correct access level.

## How It Works

### Commit Message Format

For automatic versioning to work, your commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

- `fix: message` - for bug fixes (PATCH version bump)
- `feat: message` - for new features (MINOR version bump)
- `feat!: message` or `fix!: message` - for breaking changes (MAJOR version bump)
- `docs: message` - for documentation changes (no version bump)
- `chore: message` - for maintenance tasks (no version bump)
- `test: message` - for test-related changes (no version bump)
- `refactor: message` - for code refactoring (no version bump unless with !)
- `style: message` - for code style changes (no version bump)

Examples:

```
feat: add new visualization option
fix: resolve memory leak in recording
docs: improve API documentation
feat!: change default audio format (this is a breaking change)
```

### Workflow Triggers

The release workflow runs when:

- Code is pushed to the main branch
- Pull requests are merged into the main branch

### Manual Release

If you need to trigger a release manually:

1. Ensure your commits follow the conventional format
2. Push your changes to the main branch
3. The GitHub Action will handle the rest

## Troubleshooting

If releases aren't working as expected:

1. Check GitHub Actions logs for errors
2. Verify your commit messages follow the conventional format
3. Ensure the NPM_TOKEN is valid and has publish permissions
4. Make sure all tests are passing

## Best Practices

1. **Always use conventional commits**: Get in the habit of writing descriptive, conventional commit messages.
2. **Work in feature branches**: Develop in separate branches and merge to main when ready to release.
3. **Review the changelog before release**: The changelog is automatically generated, but you may want to edit it for clarity.
4. **Version carefully**: Breaking changes should be clearly marked with `!` and include migration instructions.

## CI/CD Workflow

The full release process includes:

1. Code Push → GitHub Actions triggers workflow
2. Install dependencies with `pnpm install`
3. Run tests with `pnpm test`
4. Build the package with `pnpm build`
5. semantic-release determines the version bump based on commits
6. Package is published to npm
7. Release notes are generated
8. CHANGELOG.md is updated
9. GitHub release is created

This automated process ensures consistent, reliable releases with minimal manual effort.
