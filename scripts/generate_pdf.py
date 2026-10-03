import os
import subprocess
import time

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>cassette.fm — The Complete PWA Manual & Architecture Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Shrikhand&display=swap');

    @page {
      size: A4;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #71717a;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #050507;
      color: #e4e4e7;
      font-size: 9.5pt;
      line-height: 1.55;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* ── Typography & Header Styles ── */
    h1, h2, h3, h4 {
      color: #ffffff;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    h1 {
      font-size: 20pt;
      margin-bottom: 6px;
    }

    h2 {
      font-size: 14pt;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      padding-bottom: 6px;
      margin-top: 18px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h2 .section-num {
      display: inline-block;
      background: #18181b;
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 4px;
      font-size: 8pt;
      padding: 2px 7px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
    }

    h3 {
      font-size: 11pt;
      color: #f4f4f5;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    p {
      margin-bottom: 8px;
      color: #a1a1aa;
    }

    strong {
      color: #ffffff;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      background: #141417;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 1px 4px;
      border-radius: 4px;
      color: #38bdf8;
    }

    /* ── Cover Page ── */
    .cover-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 20px 20px 20px;
    }

    .cover-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      font-family: 'Shrikhand', cursive;
      font-size: 38pt;
      color: #ffffff;
      letter-spacing: -0.03em;
      line-height: 1;
    }

    .brand-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 16px #10b981;
      display: inline-block;
      margin-top: 4px;
    }

    .cover-tagline {
      font-size: 11pt;
      color: #71717a;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 12px;
    }

    .cover-hero-title {
      font-size: 26pt;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      letter-spacing: -0.03em;
      margin-top: 40px;
      margin-bottom: 16px;
    }

    .cover-hero-desc {
      font-size: 11pt;
      color: #a1a1aa;
      max-width: 600px;
      line-height: 1.6;
    }

    .badge-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 24px;
    }

    .badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      background: #161619;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d4d4d8;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .badge.emerald {
      border-color: rgba(16, 185, 129, 0.4);
      color: #10b981;
      background: rgba(16, 185, 129, 0.08);
    }

    .badge.cyan {
      border-color: rgba(6, 182, 212, 0.4);
      color: #06b6d4;
      background: rgba(6, 182, 212, 0.08);
    }

    .badge.violet {
      border-color: rgba(139, 92, 246, 0.4);
      color: #8b5cf6;
      background: rgba(139, 92, 246, 0.08);
    }

    .badge.amber {
      border-color: rgba(245, 158, 11, 0.4);
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.08);
    }

    .cover-meta-box {
      background: #0d0d10;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 18px 24px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .meta-item-label {
      font-size: 7.5pt;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #71717a;
      margin-bottom: 4px;
    }

    .meta-item-value {
      font-size: 10pt;
      font-weight: 600;
      color: #ffffff;
    }

    /* ── Content Cards & Layouts ── */
    .card {
      background: #0e0e11;
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .card-title {
      font-size: 10pt;
      font-weight: 700;
      color: #ffffff;
    }

    .card-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      padding: 2px 6px;
      border-radius: 4px;
      background: #1c1c20;
      color: #a1a1aa;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
      font-size: 8.5pt;
    }

    th {
      background: #121216;
      color: #f4f4f5;
      font-weight: 700;
      text-align: left;
      padding: 7px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    td {
      padding: 7px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #a1a1aa;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: rgba(255, 255, 255, 0.015);
    }

    td strong {
      color: #ffffff;
    }

    /* ── Callout Box ── */
    .callout {
      border-left: 3px solid #10b981;
      background: rgba(16, 185, 129, 0.05);
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      margin: 10px 0;
    }

    .callout.amber {
      border-left-color: #f59e0b;
      background: rgba(245, 158, 11, 0.05);
    }

    .callout.cyan {
      border-left-color: #06b6d4;
      background: rgba(6, 182, 212, 0.05);
    }

    .callout-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #ffffff;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ── Settings Subpage Item ── */
    .setting-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .setting-item:last-child {
      border-bottom: none;
    }

    .setting-info {
      flex: 1;
      padding-right: 14px;
    }

    .setting-title {
      font-size: 9pt;
      font-weight: 600;
      color: #ffffff;
    }

    .setting-desc {
      font-size: 8pt;
      color: #71717a;
      margin-top: 1px;
    }

    .setting-control {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      padding: 2px 7px;
      background: #18181c;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: #e4e4e7;
      white-space: nowrap;
    }

    .pill-active {
      background: #ffffff;
      color: #000000;
      font-weight: 700;
    }

    /* ── Table of Contents ── */
    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
      font-size: 9pt;
    }

    .toc-title {
      color: #e4e4e7;
      font-weight: 500;
    }

    .toc-dots {
      flex: 1;
      margin: 0 8px;
      border-bottom: 1px dotted rgba(255, 255, 255, 0.15);
      height: 10px;
    }

    .toc-page {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      color: #10b981;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- COVER PAGE                                                                -->
  <!-- ========================================================================= -->
  <div class="cover-container page-break">
    <div>
      <div class="cover-brand">
        <span class="brand-logo">cassette.fm</span>
        <span class="brand-dot"></span>
      </div>
      <div class="cover-tagline">Official PWA & Mobile Architecture Manual</div>

      <div class="cover-hero-title">
        The Complete Progressive Web App,<br>
        Native Engine & Settings Guide
      </div>

      <p class="cover-hero-desc">
        Comprehensive documentation of cassette.fm — a high-fidelity, privacy-preserving music streaming ecosystem. Covering full PWA architecture, YouTube Music InnerTube gateway, lossy & lossless Opus/AAC bitrates, local-first offline caching, two-way Supabase Google Cloud synchronization, and an exhaustive breakdown of every option, subpage, and diagnostic toggle.
      </p>

      <div class="badge-grid">
        <span class="badge emerald">● PWA Ready (Service Worker v2)</span>
        <span class="badge cyan">● Web Audio API & MediaSession</span>
        <span class="badge violet">● YouTube Music InnerTube Gateway</span>
        <span class="badge amber">● Supabase PostgreSQL & RLS</span>
        <span class="badge">● React 18 / Vite 8 + Expo Mobile</span>
        <span class="badge">● Lossless 256kbps Opus (Itag 251)</span>
        <span class="badge">● Synced LRC Karaoke Engine</span>
        <span class="badge">● Pure Pitch-Black OLED UI</span>
      </div>
    </div>

    <div class="cover-meta-box">
      <div>
        <div class="meta-item-label">Version</div>
        <div class="meta-item-value">v2.5.0 Production</div>
      </div>
      <div>
        <div class="meta-item-label">Target Platforms</div>
        <div class="meta-item-value">PWA (Web) & iOS / Android</div>
      </div>
      <div>
        <div class="meta-item-label">Generated Date</div>
        <div class="meta-item-value">October 2026</div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TABLE OF CONTENTS & EXECUTIVE SUMMARY                                     -->
  <!-- ========================================================================= -->
  <div>
    <h2><span class="section-num">TOC</span> Table of Contents</h2>
    
    <div style="margin-bottom: 20px;">
      <div class="toc-item">
        <span class="toc-title"><strong>Section 1:</strong> System Overview & Design Philosophy</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 2</span>
      </div>
      <div class="toc-item">
        <span class="toc-title"><strong>Section 2:</strong> PWA Architecture, Service Workers & Offline Caching</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 3</span>
      </div>
      <div class="toc-item">
        <span class="toc-title"><strong>Section 3:</strong> Audio Streaming Pipeline & Codec Bitrate Parity</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 4</span>
      </div>
      <div class="toc-item">
        <span class="toc-title"><strong>Section 4:</strong> Core User Views & Interface Walkthrough</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 5</span>
      </div>
      <div class="toc-item">
        <span class="toc-title"><strong>Section 5:</strong> Master Settings Manual — General, Audio & Playback</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 6</span>
      </div>
      <div class="toc-item">
        <span class="toc-title"><strong>Section 6:</strong> Master Settings Manual — Interface, Content & Importers</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 7</span>
      </div>
      <div class="toc-item">
        <span class="toc-title"><strong>Section 7:</strong> Master Settings Manual — Storage, Lyrics, Diagnostics & Hotkeys</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 8</span>
      </div>
      <div class="toc-item">
        <span class="toc-title"><strong>Section 8:</strong> Cloud Database Schema & Two-Way Sync Engine</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 9</span>
      </div>
      <div class="toc-item">
        <span class="toc-title"><strong>Section 9:</strong> Cross-Platform Parity: Web PWA vs Native Mobile App</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 10</span>
      </div>
      <div class="toc-item">
        <span class="toc-title"><strong>Section 10:</strong> Technical Appendix & API Reference Specifications</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 11</span>
      </div>
    </div>

    <h2><span class="section-num">01</span> System Overview & Design Philosophy</h2>
    <p>
      <strong>cassette.fm</strong> was created to solve the fundamental compromises of modern commercial streaming services: intrusive subscription paywalls, invasive user telemetry, algorithmically manipulated user feeds, and clunky user interfaces burdened by non-musical fluff.
    </p>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Pure Pitch-Black Aesthetic (#000000)</div>
        <p style="margin-top: 4px; font-size: 8.5pt;">
          Unlike "dark gray" apps that suffer from washouts, cassette.fm forces pure #000000 across canvas, modals, and nav bars. On modern OLED screens, pixels shut off completely, delivering infinite contrast ratios and unmatched battery efficiency.
        </p>
      </div>
      <div class="card">
        <div class="card-title">Color Exclusivity Rule</div>
        <p style="margin-top: 4px; font-size: 8.5pt;">
          The interface obeys a strict rule: high-contrast monochrome UI elements (#ffffff and zinc), allowing album artwork to be the single source of vibrant color. An ambient color extraction engine samples the artwork to softly tint docks and backlights.
        </p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Custom Retro-Modern Typography</div>
        <p style="margin-top: 4px; font-size: 8.5pt;">
          The brand utilizes <strong>Shrikhand</strong>, an expressive 1970s retro display font, paired with clean, geometric <strong>Inter</strong> across song titles, navigation labels, and settings modals, eliminating generic browser fallback styling.
        </p>
      </div>
      <div class="card">
        <div class="card-title">Zero-Compromise Audio Quality</div>
        <p style="margin-top: 4px; font-size: 8.5pt;">
          Streams are sourced directly from YouTube Music's high-bitrate Opus (itag 251 at 160–256 kbps, transparent to 320kbps MP3) and AAC pipelines, bypassing compressed 30-second previews.
        </p>
      </div>
    </div>

    <div class="callout">
      <div class="callout-title">● Core Product Guarantees</div>
      <p style="font-size: 8.5pt; margin-bottom: 0;">
        100% ad-free listening · Zero analytics or user tracking · Local-first offline playback via IndexedDB & Service Worker · Bidirectional Google & Supabase cloud synchronization · Full keyboard navigation & accessibility.
      </p>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- SECTION 2: PWA ARCHITECTURE & SERVICE WORKERS                             -->
  <!-- ========================================================================= -->
  <div>
    <h2><span class="section-num">02</span> PWA Architecture & Offline Foundation</h2>
    <p>
      cassette.fm is engineered as a fully compliant, installable <strong>Progressive Web App (PWA)</strong> providing parity with native desktop and mobile applications on macOS, Windows, Linux, iOS, and Android.
    </p>

    <div class="card">
      <div class="card-header">
        <span class="card-title">PWA Manifest Specification (public/manifest.json)</span>
        <span class="card-badge">JSON-LD Compliant</span>
      </div>
      <table style="margin: 0;">
        <tr>
          <th style="width: 25%;">Property</th>
          <th style="width: 25%;">Value</th>
          <th>Purpose & Behavior</th>
        </tr>
        <tr>
          <td><code>display</code></td>
          <td><code>standalone</code></td>
          <td>Hides browser URL bars, tabs, and chrome; opens as an independent native window.</td>
        </tr>
        <tr>
          <td><code>theme_color</code></td>
          <td><code>#000000</code></td>
          <td>Tints OS system status bars and native title bars to pitch-black.</td>
        </tr>
        <tr>
          <td><code>background_color</code></td>
          <td><code>#000000</code></td>
          <td>Prevents startup white-flashes while DOM and assets mount.</td>
        </tr>
        <tr>
          <td><code>icons</code></td>
          <td><code>192x192 & 512x512</code></td>
          <td>High-DPI icons with <code>"purpose": "any maskable"</code> for adaptive Android/iOS home screens.</td>
        </tr>
      </table>
    </div>

    <h3>Service Worker & Multi-Tier Caching Pipeline</h3>
    <p>
      The custom Service Worker implements intelligent caching strategies tailored to audio streaming, static application bundles, and dynamic YouTube Music APIs:
    </p>

    <div class="grid-3">
      <div class="card">
        <div class="card-title" style="color: #10b981;">1. Cache-First (App Shell)</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          Applied to HTML, CSS bundles, JS chunks, and Google Font files (Inter, Shrikhand). Serves cached files immediately; updates in background via Stale-While-Revalidate.
        </p>
      </div>
      <div class="card">
        <div class="card-title" style="color: #06b6d4;">2. Network-First (API)</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          Applied to <code>/api/search</code> and <code>/api/home/feed</code>. Always attempts live fetch for freshest charts; falls back to cached responses when offline.
        </p>
      </div>
      <div class="card">
        <div class="card-title" style="color: #8b5cf6;">3. Persistent Media Store</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          Downloaded tracks and album art are stored in IndexedDB chunks, allowing full uninterrupted playback without active Wi-Fi or cellular connections.
        </p>
      </div>
    </div>

    <h3>Web Audio API & Lockscreen Integration</h3>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">MediaSession API Integration</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          Wires full playback control to native lockscreens, Bluetooth headphones, smartwatch remotes, and car dashboards. Updates title, artist, album, high-resolution artwork (512x512), and playback position state:
        </p>
        <code style="font-size: 7.5pt; display: block; margin-top: 4px;">
          navigator.mediaSession.metadata = new MediaMetadata({<br>
          &nbsp;&nbsp;title: track.title, artist: track.artist,<br>
          &nbsp;&nbsp;artwork: [{ src: track.cover, sizes: '512x512' }]<br>
          });
        </code>
      </div>
      <div class="card">
        <div class="card-title">Web Audio Graph & Equalizer</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          An internal <code>AudioContext</code> chains <code>MediaElementAudioSourceNode</code> through a <code>GainNode</code> (for -14 LUFS loudness normalization and crossfading) into a 128-bin <code>AnalyserNode</code> powering the real-time animated equalizer.
        </p>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- SECTION 3: AUDIO STREAMING PIPELINE                                       -->
  <!-- ========================================================================= -->
  <div>
    <h2><span class="section-num">03</span> Audio Streaming Pipeline & Codec Fidelity</h2>
    <p>
      Audio delivery is handled through a dual-redundant proxy and resolver engine designed for instantaneous playback start times, seamless seeking, and zero buffering:
    </p>

    <div class="card">
      <div class="card-header">
        <span class="card-title">YouTube Music Codec & Itag Resolution Matrix</span>
        <span class="card-badge">Audiophile Parity</span>
      </div>
      <table>
        <tr>
          <th>Quality Preset</th>
          <th>Itag</th>
          <th>Audio Codec</th>
          <th>Nominal Bitrate</th>
          <th>Sample Rate</th>
          <th>Container</th>
        </tr>
        <tr>
          <td><strong style="color: #10b981;">Max (Hi-Fi)</strong></td>
          <td><code>251</code></td>
          <td>Opus (VBR)</td>
          <td>160–256 kbps (transparent to 320k MP3)</td>
          <td>48.0 kHz</td>
          <td><code>audio/webm; codecs="opus"</code></td>
        </tr>
        <tr>
          <td><strong style="color: #06b6d4;">High Quality</strong></td>
          <td><code>140</code></td>
          <td>AAC (mp4a.40.2)</td>
          <td>128–160 kbps (Clean Studio AAC)</td>
          <td>44.1 kHz</td>
          <td><code>audio/mp4</code></td>
        </tr>
        <tr>
          <td><strong style="color: #f59e0b;">Medium (Data Saver)</strong></td>
          <td><code>249 / 250</code></td>
          <td>Opus (VBR)</td>
          <td>50–70 kbps (Ultra-compressed)</td>
          <td>48.0 kHz</td>
          <td><code>audio/webm; codecs="opus"</code></td>
        </tr>
      </table>
    </div>

    <h3>HTTP Range Streaming (RFC 7233)</h3>
    <p>
      The streaming server gateway (<code>/api/stream/:id</code>) handles partial content streaming via standard HTTP range headers:
    </p>
    <ul>
      <li style="margin-left: 18px; color: #a1a1aa; font-size: 8.5pt;">
        <strong>Scrubbing Efficiency:</strong> When users seek forward on the progress bar, the browser requests <code>Range: bytes=1048576-</code>, streaming exclusively the remaining bytes without redownloading the track.
      </li>
      <li style="margin-left: 18px; color: #a1a1aa; font-size: 8.5pt;">
        <strong>Zero-CORS Embedded Failover:</strong> If direct CDN streams face token expiration or geo-blocks, a headless YouTube audio runtime seamlessly takes over on the client thread, guaranteeing uninterrupted playback.
      </li>
    </ul>

    <h3 style="margin-top: 14px;">Dynamic Recommendation & Queue Engine</h3>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Watch Next Algorithmic Queue</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          When any individual song is selected, the server queries <code>/api/next/:id</code>, extracting up to 50 contextually related tracks from YouTube Music's recommendation graph. This guarantees automatic, personalized radio without user curation.
        </p>
      </div>
      <div class="card">
        <div class="card-title">Infinite Auto-Advance & Prefetch</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          When the user reaches the final 2 songs in an active playlist or queue, background workers automatically fetch another recommendation batch using the final song's seed, delivering an endless radio stream.
        </p>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- SECTION 4: CORE VIEWS & INTERFACE WALKTHROUGH                            -->
  <!-- ========================================================================= -->
  <div>
    <h2><span class="section-num">04</span> Core Views & Interface Walkthrough</h2>
    <p>
      The cassette.fm interface is architected around 5 core view spaces, unified by persistent transport controls and silky-smooth transitions:
    </p>

    <div class="card">
      <div class="card-title">1. Dynamic Branded Header</div>
      <p style="font-size: 8.5pt; margin-top: 2px;">
        Features the iconic <strong>cassette.fm</strong> brand logo in retro Shrikhand font. Attached is the <strong>Live Status Dot</strong>:
      </p>
      <div style="display: flex; gap: 12px; margin-top: 4px; font-size: 8pt;">
        <span style="color: #10b981;">● Emerald: Audio streaming active</span>
        <span style="color: #f59e0b;">● Amber: Cloud synchronization in progress</span>
        <span style="color: #71717a;">● Zinc: System idle & ready</span>
      </div>
      <p style="font-size: 8pt; margin-top: 4px;">
        On the right are three quick-action icons: <strong>Search Trigger</strong>, <strong>User Avatar / Auth Switcher</strong> (shows Google profile initials when connected), and <strong>Settings Gear</strong>.
      </p>
    </div>

    <div class="card">
      <div class="card-title">2. Home Feed & Horizontal Shelves</div>
      <p style="font-size: 8.5pt; margin-top: 2px;">
        Pure real-time feed fetched from <code>/api/home/feed</code> organized into horizontal carousel shelves:
      </p>
      <ul style="margin-left: 18px; font-size: 8pt; color: #a1a1aa; margin-top: 4px;">
        <li><strong>Filter Chips:</strong> <code>All</code>, <code>Quick Picks</code>, <code>Mixes</code>, and <code>Albums</code> for instant shelf isolation.</li>
        <li><strong>Quick Picks:</strong> 16 top chart hits arranged in a 4-row horizontal matrix with thumbnail play and favorite triggers.</li>
        <li><strong>Daily Mixes:</strong> Algorithmic mood and artist radio mixes with rich artwork.</li>
        <li><strong>Trending Albums:</strong> Full official releases with dedicated album detail view.</li>
        <li><strong>Listen Again:</strong> Instant jump-back shelf populated from local playback history.</li>
      </ul>
    </div>

    <div class="card">
      <div class="card-title">3. Explore & Search Engine</div>
      <p style="font-size: 8.5pt; margin-top: 2px;">
        Debounced real-time search with instant autocomplete suggestions from <code>/api/search/suggestions</code>. Implements a <strong>punctuation-normalized search ranking algorithm</strong> so exact track matches (e.g. Steve Lacy's <em>"oh yeah?"</em>) always rank above obscure albums. Features multi-category filtering across Songs, Albums, Artists, and Playlists.
      </p>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">4. Library & Custom Playlists</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          Houses Liked Songs, custom user-created playlists with dynamic 4-tile artwork collages, YouTube Music synced collections, and offline download managers.
        </p>
      </div>
      <div class="card">
        <div class="card-title">5. Floating Mini-Player & Full Sheet</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          Mounted above tabs with realtime progress line, track metadata, and bouncy spring controls. Tapping opens the Full Sheet with dual Cover Art / Synchronized LRC Lyrics panels.
        </p>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- SECTION 5: MASTER SETTINGS MANUAL (PART 1)                                -->
  <!-- ========================================================================= -->
  <div>
    <h2><span class="section-num">05</span> Master Settings Manual — Account, Audio & Playback</h2>
    <p>
      cassette.fm features an exhaustive 9-subpage configuration studio accessible from both the web PWA and mobile applications:
    </p>

    <!-- SUBPAGE 1 -->
    <div class="card avoid-break">
      <div class="card-header">
        <span class="card-title">Subpage 1: General & Account Settings</span>
        <span class="card-badge">Cloud Auth</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">1-Click Google OAuth Sign-In</div>
          <div class="setting-desc">Authenticates securely via Supabase Google provider; loads profile avatar, name, and email.</div>
        </div>
        <span class="setting-control pill-active">Google OAuth</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Email & Password Auth</div>
          <div class="setting-desc">Complete support for custom email registrations, sign-in, and password reset flows.</div>
        </div>
        <span class="setting-control">Email / Password</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">JSON Data Backup & Restore</div>
          <div class="setting-desc">Export your entire library (liked tracks, playlists, history) to an offline JSON file; import on any device.</div>
        </div>
        <span class="setting-control">Export / Import</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Custom Supabase Instance URL</div>
          <div class="setting-desc">Advanced override allowing power users to hook cassette.fm into self-hosted Supabase backends.</div>
        </div>
        <span class="setting-control">URL & Anon Key</span>
      </div>
    </div>

    <!-- SUBPAGE 2 -->
    <div class="card avoid-break">
      <div class="card-header">
        <span class="card-title">Subpage 2: Audio Engine & Playback Quality</span>
        <span class="card-badge">Stream Fidelity</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Streaming Audio Quality Preset</div>
          <div class="setting-desc">Toggle between Max (256k Opus / Itag 251), High (160k AAC / Itag 140), and Medium (64k Opus / Data Saver).</div>
        </div>
        <span class="setting-control pill-active">Max Hi-Fi</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Audio Volume Normalization</div>
          <div class="setting-desc">Applies ReplayGain loudness leveling (-14 LUFS) to ensure songs play at consistent volume without jarring peaks.</div>
        </div>
        <span class="setting-control">Enabled (Toggle)</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Crossfade Transition Duration</div>
          <div class="setting-desc">Smoothly crossfades between consecutive tracks from 0 seconds (off) up to 12 seconds.</div>
        </div>
        <span class="setting-control">Slider (0–12s)</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Gapless Playback</div>
          <div class="setting-desc">Preloads upcoming track buffers to eliminate dead air between tracks on live and concept albums.</div>
        </div>
        <span class="setting-control">Enabled (Toggle)</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Dynamic Radio Autoplay</div>
          <div class="setting-desc">Automatically queries recommendation API when queue reaches its end to maintain infinite stream.</div>
        </div>
        <span class="setting-control">Enabled (Toggle)</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Remember Last Played Song</div>
          <div class="setting-desc">Restores the last active track and playback position automatically on fresh app launch.</div>
        </div>
        <span class="setting-control">Enabled (Toggle)</span>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- SECTION 6: MASTER SETTINGS MANUAL (PART 2)                                -->
  <!-- ========================================================================= -->
  <div>
    <h2><span class="section-num">06</span> Master Settings Manual — Interface, Content & Importers</h2>

    <!-- SUBPAGE 3 -->
    <div class="card avoid-break">
      <div class="card-header">
        <span class="card-title">Subpage 3: Appearance, Themes & Interface</span>
        <span class="card-badge">Visual Polish</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Monochrome B&W Mode</div>
          <div class="setting-desc">Renders all album art across search, home, and now-playing in high-contrast grayscale.</div>
        </div>
        <span class="setting-control">Toggle (Default: Off)</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Dynamic Color Extraction Glow</div>
          <div class="setting-desc">Samples dominant color palette from album artwork to tint sliders, docks, and glowing borders.</div>
        </div>
        <span class="setting-control pill-active">Dynamic (Toggle)</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Ambient Background Glow</div>
          <div class="setting-desc">Renders soft, radial ambient backlight behind album cover in the now-playing sheet.</div>
        </div>
        <span class="setting-control">Toggle (Default: On)</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Custom Accent Color Presets</div>
          <div class="setting-desc">Select fixed UI accent when dynamic glow is off: Pure White, Emerald (#10b981), Amber (#f59e0b), Violet (#8b5cf6), Cyan (#06b6d4), Rose (#f43f5e).</div>
        </div>
        <span class="setting-control">7 Presets</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Bottom Tab Visibility (Mobile)</div>
          <div class="setting-desc">Custom switches to hide or display specific tabs in bottom navigation: Home, Radio, Explore, Library.</div>
        </div>
        <span class="setting-control">4 Switches</span>
      </div>
    </div>

    <!-- SUBPAGE 4 -->
    <div class="card avoid-break">
      <div class="card-header">
        <span class="card-title">Subpage 4: Content & Regional Preferences</span>
        <span class="card-badge">Feed Filtering</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Content Region / Country Code</div>
          <div class="setting-desc">Sets geographic territory for home feed charts: US, GB, IN, JP, DE, FR, BR, CA, AU, etc.</div>
        </div>
        <span class="setting-control">Dropdown (ISO 3166)</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Explicit Content Filter</div>
          <div class="setting-desc">SafeMode switch to filter out tracks with explicit language badges from search and recommendations.</div>
        </div>
        <span class="setting-control">Toggle (Default: Off)</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Music Language Preferences</div>
          <div class="setting-desc">Prioritizes regional language charts (English, Hindi, Punjabi, Tamil, Telugu, Spanish, etc.).</div>
        </div>
        <span class="setting-control">Multi-select Chips</span>
      </div>
    </div>

    <!-- SUBPAGE 5 -->
    <div class="card avoid-break">
      <div class="card-header">
        <span class="card-title">Subpage 5: External Playlist Importers</span>
        <span class="card-badge">Data Portability</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">YouTube Public Playlist Importer</div>
          <div class="setting-desc">Paste any public or unlisted YouTube Music playlist URL; imports all tracks into a native playlist instantly.</div>
        </div>
        <span class="setting-control">URL Input + Fetch</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Spotify Playlist Importer</div>
          <div class="setting-desc">Resolves Spotify tracklists via Spotify Web API credits endpoint and matches each track to high-bitrate YouTube streams.</div>
        </div>
        <span class="setting-control">Spotify Bridge</span>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- SECTION 7: MASTER SETTINGS MANUAL (PART 3)                                -->
  <!-- ========================================================================= -->
  <div>
    <h2><span class="section-num">07</span> Master Settings Manual — Storage, Lyrics, Diagnostics & Hotkeys</h2>

    <!-- SUBPAGE 6 -->
    <div class="card avoid-break">
      <div class="card-header">
        <span class="card-title">Subpage 6: Storage, Downloads & Offline Mode</span>
        <span class="card-badge">Cache Manager</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Storage Footprint Inspector</div>
          <div class="setting-desc">Displays live breakdown of IndexedDB cached audio tracks, artwork image blobs, and offline state.</div>
        </div>
        <span class="setting-control">Live MB Counter</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Clear Cache & Re-index</div>
          <div class="setting-desc">Purges temporary audio buffers and stale search cache while strictly safeguarding your liked songs & playlists.</div>
        </div>
        <span class="setting-control" style="color: #ef4444;">Purge Cache</span>
      </div>
    </div>

    <!-- SUBPAGE 7 -->
    <div class="card avoid-break">
      <div class="card-header">
        <span class="card-title">Subpage 7: Synchronized Lyrics Engine</span>
        <span class="card-badge">LRC Karaoke</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Synchronized Karaoke Lyrics</div>
          <div class="setting-desc">Parses timestamped LRC files; highlights the currently sung lyric line with auto-scrolling and tap-to-seek.</div>
        </div>
        <span class="setting-control pill-active">Enabled</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Lyrics Typography Size</div>
          <div class="setting-desc">Select text scaling for lyric display: Small (16px), Normal (20px), Large (24px), Extra Large (28px).</div>
        </div>
        <span class="setting-control">4 Size Tiers</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Romanized Transliteration</div>
          <div class="setting-desc">Generates phonetic Latin script transliteration for songs with Japanese Kanji/Kana, Korean Hangul, or Cyrillic.</div>
        </div>
        <span class="setting-control">Toggle (Romanized)</span>
      </div>
    </div>

    <!-- SUBPAGE 8 -->
    <div class="card avoid-break">
      <div class="card-header">
        <span class="card-title">Subpage 8: Diagnostics & Developer Tools</span>
        <span class="card-badge">Telemetry & Health</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Supabase Database Ping</div>
          <div class="setting-desc">Tests cloud latency (ms) and validates PostgreSQL Row Level Security credentials.</div>
        </div>
        <span class="setting-control" style="color: #10b981;">Ping Cloud</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Audio Stream Resolver Health</div>
          <div class="setting-desc">Inspects active audio stream itag (e.g. 251 Opus), container type, sample rate, and buffering latency.</div>
        </div>
        <span class="setting-control">Itag Inspector</span>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">Live Diagnostics Event Log</div>
          <div class="setting-desc">Streams real-time internal errors, network status codes, and cache events with one-click copy to clipboard.</div>
        </div>
        <span class="setting-control">Copy Logs</span>
      </div>
    </div>

    <!-- SUBPAGE 9 -->
    <div class="card avoid-break">
      <div class="card-header">
        <span class="card-title">Subpage 9: Keyboard Shortcuts Reference Matrix (PWA)</span>
        <span class="card-badge">Accessibility</span>
      </div>
      <table>
        <tr>
          <th>Shortcut Key</th>
          <th>Action Executed</th>
          <th>Shortcut Key</th>
          <th>Action Executed</th>
        </tr>
        <tr>
          <td><code>Space</code></td>
          <td>Play / Pause Toggle</td>
          <td><code>Shift + &rarr;</code></td>
          <td>Skip to Next Track</td>
        </tr>
        <tr>
          <td><code>Shift + &larr;</code></td>
          <td>Skip to Previous Track</td>
          <td><code>L</code></td>
          <td>Toggle Favorite / Liked Song</td>
        </tr>
        <tr>
          <td><code>M</code></td>
          <td>Mute / Unmute Audio</td>
          <td><code>/</code> or <code>F</code></td>
          <td>Focus Real-Time Search Bar</td>
        </tr>
        <tr>
          <td><code>Esc</code></td>
          <td>Close Modal / Back to Home</td>
          <td><code>Shift + S</code></td>
          <td>Toggle Shuffle Mode</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- SECTION 8: CLOUD DATABASE SCHEMA                                         -->
  <!-- ========================================================================= -->
  <div>
    <h2><span class="section-num">08</span> Cloud Database Schema & Two-Way Sync Engine</h2>
    <p>
      Multi-device synchronization is powered by <strong>Supabase PostgreSQL</strong> with strict <strong>Row Level Security (RLS)</strong>, ensuring users can only read and write their own data:
    </p>

    <div class="card">
      <div class="card-header">
        <span class="card-title">PostgreSQL Tables Structure (supabase_schema.sql)</span>
        <span class="card-badge">Postgres 15</span>
      </div>
      <table>
        <tr>
          <th style="width: 25%;">Table Name</th>
          <th style="width: 35%;">Columns & Data Types</th>
          <th>Security & Purpose</th>
        </tr>
        <tr>
          <td><code>profiles</code></td>
          <td><code>id (uuid PK), full_name (text), email (text), avatar_url (text), updated_at</code></td>
          <td>Stores user metadata; auto-populated upon Google OAuth login via PostgreSQL trigger.</td>
        </tr>
        <tr>
          <td><code>liked_songs</code></td>
          <td><code>id (uuid PK), user_id (uuid FK), song_id (text), song_data (jsonb), created_at</code></td>
          <td>Unique index on <code>(user_id, song_id)</code>. Stores full track metadata payload for instant offline hydration.</td>
        </tr>
        <tr>
          <td><code>user_playlists</code></td>
          <td><code>id (text PK), user_id (uuid FK), name (text), songs (jsonb[]), created_at, updated_at</code></td>
          <td>Stores custom playlists created on Web or Mobile. Allows collaborative sharing when marked public.</td>
        </tr>
        <tr>
          <td><code>playback_history</code></td>
          <td><code>id (uuid PK), user_id (uuid FK), song_data (jsonb), played_at (timestamptz)</code></td>
          <td>Chronological listening stream powering the "Listen Again" home shelf across all logged-in devices.</td>
        </tr>
      </table>
    </div>

    <h3>Two-Way Union Merge Algorithm</h3>
    <p>
      When users sync between devices or link their Google accounts, cassette.fm executes a conflict-free 4-phase synchronization algorithm:
    </p>

    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="color: #10b981;">Phase 1: Local Push</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          Extracts local <code>likedSongs</code> and <code>pulse_playlists</code> from storage; pushes newly created local items up to Supabase Cloud using batch <code>upsert</code>.
        </p>
      </div>
      <div class="card">
        <div class="card-title" style="color: #06b6d4;">Phase 2: Cloud Pull</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          Retrieves cloud-stored liked songs, custom playlists, and playback history records for the authenticated <code>user_id</code>.
        </p>
      </div>
      <div class="card">
        <div class="card-title" style="color: #8b5cf6;">Phase 3: Union Reconciliation</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          Merges local and cloud collections by unique <code>id / videoId</code>. If playlists conflict, the version with the greatest track count or newest timestamp wins.
        </p>
      </div>
      <div class="card">
        <div class="card-title" style="color: #f59e0b;">Phase 4: Persistence</div>
        <p style="font-size: 8pt; margin-top: 4px;">
          Writes merged union back to local storage and pushes merged deltas to the cloud database, achieving 100% parity across devices.
        </p>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- SECTION 9: CROSS-PLATFORM PARITY                                         -->
  <!-- ========================================================================= -->
  <div>
    <h2><span class="section-num">09</span> Cross-Platform Parity: Web PWA vs Native Mobile App</h2>
    <p>
      cassette.fm shares a unified architectural core (<code>@cassette/core</code>) between the Web PWA client and the native iOS/Android Expo client:
    </p>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Feature & Implementation Parity Matrix</span>
        <span class="card-badge">Full Ecosystem Parity</span>
      </div>
      <table>
        <tr>
          <th>Capability / Feature</th>
          <th>Web PWA Implementation</th>
          <th>Native Mobile Implementation</th>
        </tr>
        <tr>
          <td><strong>Audio Playback Engine</strong></td>
          <td>Web Audio API + HTML5 Audio + AnalyserNode</td>
          <td><code>react-native-track-player</code> Native Foreground Service</td>
        </tr>
        <tr>
          <td><strong>Background Playback</strong></td>
          <td>MediaSession API + Service Worker worker thread</td>
          <td>Android MediaStyle Notification + iOS Audio Background Mode</td>
        </tr>
        <tr>
          <td><strong>Startup Splash Experience</strong></td>
          <td>CSS pure black canvas (#000000)</td>
          <td>Expo Splash Plugin + <code>preventAutoHideAsync()</code></td>
        </tr>
        <tr>
          <td><strong>UI Gestures & Animations</strong></td>
          <td>CSS transitions + Tailwind utility classes</td>
          <td><code>react-native-reanimated</code> Spring & Timing physics</td>
        </tr>
        <tr>
          <td><strong>State Management</strong></td>
          <td>React Context + Zustand stores</td>
          <td>Zustand stores (shared isomorphic <code>@cassette/core</code>)</td>
        </tr>
        <tr>
          <td><strong>Offline Data Storage</strong></td>
          <td>IndexedDB + LocalStorage</td>
          <td><code>AsyncStorage</code> + SQLite offline cache</td>
        </tr>
        <tr>
          <td><strong>Navigation Layout</strong></td>
          <td>Desktop Sidebar / Top Bar</td>
          <td>4-Tab Bottom Nav (Home, Radio, Explore, Library)</td>
        </tr>
        <tr>
          <td><strong>Settings Access</strong></td>
          <td>Header gear icon & modal studio</td>
          <td>Top-right header gear icon strictly</td>
        </tr>
      </table>
    </div>

    <h3>Monorepo Code Organization</h3>
    <code style="font-size: 8pt; display: block; padding: 10px; background: #0c0c0f; border-radius: 8px;">
      cassette.fm/ monorepo<br>
      ├── src/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Web Progressive Web App (React 18 / Vite 8 / Tailwind)<br>
      ├── apps/mobile/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Native Mobile Client (Expo SDK 52 / React Native / Reanimated)<br>
      ├── packages/core/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Shared Isomorphic Logic (Zustand stores, Supabase, InnerTube)<br>
      ├── api/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Serverless API Endpoints (Stream proxy, search, feeds)<br>
      └── supabase_schema.sql &nbsp;&nbsp;&nbsp;# PostgreSQL schema & Row Level Security definitions
    </code>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- SECTION 10: TECHNICAL APPENDIX & API REFERENCE                            -->
  <!-- ========================================================================= -->
  <div>
    <h2><span class="section-num">10</span> Technical Appendix & API Reference Specifications</h2>
    <p>
      cassette.fm communicates through high-speed serverless endpoints connecting client apps to YouTube Music and Supabase:
    </p>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Serverless API Endpoints Specification</span>
        <span class="card-badge">RESTful JSON Gateway</span>
      </div>
      <table>
        <tr>
          <th>Endpoint Route</th>
          <th>HTTP Method</th>
          <th>Request Query / Payload</th>
          <th>Response Description</th>
        </tr>
        <tr>
          <td><code>/api/home/feed</code></td>
          <td><code>GET</code></td>
          <td>None</td>
          <td>Returns live Quick Picks, Daily Mixes, and Trending Albums shelves.</td>
        </tr>
        <tr>
          <td><code>/api/search</code></td>
          <td><code>GET</code></td>
          <td><code>?q={query}&type={songs|albums|...}</code></td>
          <td>Performs punctuation-normalized search across YouTube Music catalog.</td>
        </tr>
        <tr>
          <td><code>/api/search/suggestions</code></td>
          <td><code>GET</code></td>
          <td><code>?q={query}</code></td>
          <td>Live autocomplete suggestions as the user types in the search bar.</td>
        </tr>
        <tr>
          <td><code>/api/stream/:id</code></td>
          <td><code>GET</code></td>
          <td><code>Range: bytes=...</code></td>
          <td>Streams high-bitrate Opus (Itag 251) or AAC with 206 Partial Content.</td>
        </tr>
        <tr>
          <td><code>/api/next/:id</code></td>
          <td><code>GET</code></td>
          <td>None</td>
          <td>Extracts 50 Watch Next algorithmic recommendations from seed track.</td>
        </tr>
        <tr>
          <td><code>/api/lyrics</code></td>
          <td><code>GET</code></td>
          <td><code>?id={videoId}&title={t}&artist={a}</code></td>
          <td>Retrieves synchronized LRC lyrics with millisecond timestamp markers.</td>
        </tr>
        <tr>
          <td><code>/api/spotify/credits</code></td>
          <td><code>GET</code></td>
          <td><code>?q={songTitle}+{artist}</code></td>
          <td>Enriches track with Spotify songwriter, producer, and performer credits.</td>
        </tr>
        <tr>
          <td><code>/api/ytmusic/library</code></td>
          <td><code>POST</code></td>
          <td><code>{ cookie?: string }</code></td>
          <td>Syncs user's remote YouTube Music playlists and liked tracks.</td>
        </tr>
        <tr>
          <td><code>/api/ytmusic/like</code></td>
          <td><code>POST</code></td>
          <td><code>{ videoId, liked: boolean }</code></td>
          <td>Dispatches like / unlike events back to YouTube Music cloud account.</td>
        </tr>
      </table>
    </div>

    <div class="card" style="margin-top: 14px;">
      <div class="card-title">Summary & Conclusion</div>
      <p style="font-size: 8.5pt; margin-top: 4px;">
        cassette.fm represents a gold standard in modern Progressive Web App engineering: fusing uncompromised audiophile playback (256kbps Opus), tactile 1970s cassette aesthetics with pitch-black OLED styling, instant offline responsiveness, and full cloud data sovereignty.
      </p>
      <p style="font-size: 8pt; color: #71717a; margin-top: 6px; font-family: 'JetBrains Mono', monospace;">
        cassette.fm · Engineered with React, Vite, InnerTube, Supabase & Web Audio API. Zero Ads · Zero Telemetry.
      </p>
    </div>
  </div>

</body>
</html>
"""

html_file = os.path.abspath("cassette_fm_complete_pwa_guide.html")
pdf_file = os.path.abspath("cassette_fm_complete_pwa_guide.pdf")

with open(html_file, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Wrote HTML file to: {html_file}")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_path):
    edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

print(f"Using Edge at: {edge_path}")

cmd = [
    edge_path,
    "--headless=new",
    "--disable-gpu",
    f"--print-to-pdf={pdf_file}",
    "--no-pdf-header-footer",
    html_file
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("Subprocess finished. Return code:", res.returncode)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)

time.sleep(2)
if os.path.exists(pdf_file):
    size_bytes = os.path.getsize(pdf_file)
    print(f"SUCCESS: Generated PDF at {pdf_file} ({size_bytes} bytes)")
else:
    print("FAILED: PDF file was not created.")
