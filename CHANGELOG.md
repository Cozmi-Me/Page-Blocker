# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-01

### Changed
- Migrated from Manifest V2 to Manifest V3
- Replaced `webRequest` API with `declarativeNetRequest` API
- Converted background page to service worker
- Replaced `setInterval` for cloud sync with `alarms` API
- Updated deprecated `chrome.browserAction` to `chrome.action`
- Updated default block patterns format
- Added host permissions section in manifest

### Added
- `declarativeNetRequestFeedback` permission for debugging
- `alarms` permission for periodic sync
- Host permissions section in manifest

### Fixed
- Cloud sync now properly triggers rule updates
- Block counter now properly persists across sessions

## [0.1.0] - Initial Release

### Added
- URL blocking functionality
- Local block list support
- Cloud sync capability
- Enable/disable toggle
- Visual status indicators (grey, green, yellow, red)
- Block counter per session
- Settings page for configuration
- Default ad network block patterns
