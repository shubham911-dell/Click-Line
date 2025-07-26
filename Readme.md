Word Snap Selector Chrome Extension
Developer: Shubham Dhakal
Version: 3.1

Overview
Word Snap Selector is a professional Chrome extension that enhances text selection by automatically snapping to whole words, regardless of where you start your selection. It solves the common problem of inaccurate text selection caused by touchpad sensitivity or imprecise mouse movements. The extension also provides smart link copying functionality with a simple Ctrl+drag gesture.

Features
Intelligent Word Selection
Automatically selects complete words regardless of start position

Handles punctuation, special characters, and word boundaries

Works consistently across all websites and web applications

Smart Link Copying
Copy link URLs with Ctrl+drag gesture

Visually highlights entire links during copying

Seamless integration with browser clipboard

Customizable Configuration
Define custom word characters using regex syntax

Toggle extension on/off as needed

Settings persist between browser sessions

Installation
From Chrome Web Store
Visit the Chrome Web Store listing

Click "Add to Chrome"

Confirm installation when prompted

Manual Installation
Clone or download this repository

Open Chrome and navigate to chrome://extensions

Enable "Developer mode" (toggle in top-right corner)

Click "Load unpacked" and select the extension directory

Pin the extension to your toolbar for easy access

Usage
Basic Text Selection
Click and drag to select text as normal

Selection automatically expands to include complete words

Selected text can be copied with standard shortcuts (Ctrl+C)

Link Copying
Hover over any link

Hold the Ctrl key

Click and drag anywhere on the link

The URL is copied to clipboard automatically

Configuration
Click the extension icon in your toolbar

Adjust settings as needed:

Toggle extension on/off

Modify "Word Characters" field (default: \w\-)

Click "Save Settings" to apply changes

Technical Details
Word Character Configuration
The "Word Characters" setting uses regex character classes:

\w: Letters (a-z, A-Z), numbers (0-9), underscores (_)

\-: Hyphen character

Add other characters as needed (e.g., $#@. for programming)

System Requirements
Google Chrome version 88 or newer

Windows, macOS, or ChromeOS