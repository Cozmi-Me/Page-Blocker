# Browser extention: `Page Blocker`
- Target browser: Any `Chromium` based
- `GitHub` project URL: `https://github.com/Cozmi-Me/Page-Blocker`

## Purpose
The extention should intercept all requests made by the browser and compare the URL against regular expression patterns listed in a local file. The request should be blocked if a pattern match is found.

## Feature
- Option to enable/disable blocking operation
- Toolbar icons as `SVG`
- ### Toolbar icon should indicate activity
    - `Grey` when disabled
    - `Green` when idle
    - Blink `Yellow` when working
    - Blink `Red` when blocked
- Put a `block counter` to show the number of requests blocked in current session
- Local `block list` file in plain text
    - Reguler expression block patterns per line
    - Allow commenting out a line with a leading `#` character
    - Put a help summary comment section at top
- ### Cloud sync
    - Extension should accept a Cloud Sync URL as a setting
    - Periodically download a preset block list from that URL
    - Also block requests that match a pattern in this Cloud Sync block list
    - Cloud block list should have the same file and record format like local block list

## Default
- Do not repopulate local block list if it already has active records
- Populate local block list with a few advertisement blocking patterns

## Developer
- Name: `Cozmi The Deity`
- Email: `Info@Cozmi.Me`
- Web: `https://cozmi.me`
- Location: `Universe`