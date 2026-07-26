# 🎵 Favorite Player (WebXDC)

A beautiful, lightweight, and modern **WebXDC music player** designed specifically for the **Delta Chat ecosystem**. Built with a Glassmorphism UI and a dynamic video background, this app allows you to create, play, and share your favorite playlists directly within your chats.

> **"Share Your Favorite Music"**

---

## 🌟 Delta Chat & WebXDC Integration

This project is not just a standard web player; it is fully optimized for **WebXDC**. 
- **Interactive Sharing:** Send the app inside a Delta Chat conversation. The receiver can play your selected tracks, add or remove songs, and automatically generate a new `.xdc` package to share forward!
- **Dynamic Authorship:** The "Last Editor" name automatically updates every time a user modifies the playlist and shares the new bundle.

---

## ✨ Key Features

- **Modern User Interface:** Sleek dark mode design combined with attractive glassmorphism effects.
- **Dynamic Video Background:** Smooth panning animations for an immersive experience.
- **Intro Screen:** Features a dedicated, smoothly fading welcome screen.
- **Playlist Management:** Select multiple audio files from your device, play them sequentially, and manage your tracks easily.
- **Marquee Track Name:** The currently playing song's name smoothly scrolls across the top of the screen.
- **Smart Auto-Play:** Complies with modern browser security policies by triggering autoplay upon the first interaction.

---

## 📱 Compatibility

✅ **Windows (Delta Chat Desktop):** Outstanding performance and fully stable.  
✅ **Android (Delta Chat Android):** Fully tested and highly responsive with excellent touch support. Includes custom `FileReader` logic for maximum compatibility within the WebXDC container.  
⚠️ **iOS (iPhone/iPad):** Currently not fully supported due to strict iOS Safari constraints inside WebView. The primary focus of this project is Android and Windows environments.

---

## 🛠 Tech Stack

Built natively for WebXDC without heavy dependencies:
- **HTML5 & CSS3** (Structure, Glassmorphism, and Keyframe animations)
- **Vanilla JavaScript** (Playback logic, DOM manipulation, and WebXDC state handling)
- **JSZip** (For generating and repacking new `.xdc` music bundles on the fly)

---

## 🚀 How to Build & Test

To test this as a WebXDC app:
1. Clone the repository:
   ```bash
   https://github.com/MesterMiM/Delta-Favorite-Player
2. Zip all the project files (ensure index.html is at the root of the zip archive).
3. Change the file extension from .zip to .xdc (e.g., Favorite-Player.xdc).
4. Send the file in any Delta Chat conversation and enjoy!

## 👨‍💻 Developer

Developed by Mester Morgan

 - **Delta Chat Ecosystem Contributor**
 - **GitHub Profile**

***If you enjoyed this WebXDC app, please consider giving it a ⭐ on GitHub!***
