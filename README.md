## About cassette.fm 📼

**cassette.fm** is a high-performance, mobile-first music streaming PWA designed to deliver a seamless, zero-latency listening experience with a minimalist, ArchiveTune-inspired monochrome aesthetic.

### 🎓 The Story Behind the Code
I am a First-Year (FY) B.Tech Computer Engineering student, and I built this entire project from the ground up using **Antigravity** (AI) as my pair-programmer. 

I didn't build this just to make another music app—I built it to learn. By using AI to guide me through the development process, I was able to dive deep into complex backend mechanics and reverse engineering concepts that usually take years to encounter. 

Through building cassette.fm, I learned how to:
* **Reverse-Engineer APIs:** Understand and consume the undocumented YouTube Music / InnerTube APIs to fetch audio streams, lyrics, and metadata.
* **Handle Complex Audio Pipelines:** Work with the Web Audio API to build N+1 aggressive prefetching and true gapless playback.
* **Master State & Caching:** Implement offline-first architecture using `IndexedDB` and Service Workers to cache the last 70 played songs.
* **Bridge Ecosystems:** Bypass CORS and build proxy matchers to seamlessly convert Spotify playlists into playable YouTube Music queues.

This project is a personal sandbox for learning how real-world, enterprise-level streaming platforms actually work under the hood.

---
**Made with ⚡ Antigravity**
