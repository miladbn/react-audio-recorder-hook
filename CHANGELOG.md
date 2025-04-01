# Changelog

All notable changes to the `react-audio-recorder-hook` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive documentation structure in `docs-src/`
- Example component for audio visualization
- TypeScript type definitions for all functions and interfaces
- Detailed contributing guidelines
- Best practices documentation for package maintenance
- Testing infrastructure with Vitest

### Changed

- Updated ESLint configuration to the latest standards
- Improved TypeScript configuration

### Fixed

- Dependency version issues for c8 and other packages
- Added @types/node to fix NodeJS namespace type errors

## [1.0.5] - 2024-03-25

### Fixed

- iOS compatibility issue with audio MIME types
- Added detection for iOS devices and automatic format selection
- Updated blob creation to use iOS-friendly formats (mp4/aac) when on iOS devices
- Added troubleshooting section in README for iOS-specific guidance

## [0.1.0] - Initial Release

### Added

- Core audio recording hook with TypeScript support
- Pause/resume functionality
- Recording status management
- Audio blob handling
- Basic documentation
