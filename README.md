# Cam Pong 🏓

**Play it now:** https://tahahumam233-blip.github.io/cam-pong/

A neon two-player pong game for phones. Play with two thumbs on one phone, or pair
two phones in seconds: the host shows a QR code, player 2 scans it with their normal
phone camera and the game connects automatically — phone-to-phone over WebRTC, no
accounts, no app store, nothing to install.

## Features

- **One-scan multiplayer** — QR code is just a link; scanning it joins the game.
  Works across different networks (TURN relay fallback) and auto-reconnects if a
  player drops, keeping the score.
- **Real racket feel** — where the ball lands on your paddle steers it, and the
  speed of your swipe at the moment of impact adds pace and bends the angle:
  flick, smash, slice.
- **Power-ups** — grow your paddle, shrink your opponent's, speed up or slow down
  the ball.
- **Settings** — ball speed, paddle size, win score (5/7/11), power-ups, sound.
  Saved on your phone; the host's settings apply online.
- **Neon visuals & retro sound** — glowing paddles, ball trail, particles, beeps.
- **Installable PWA** — works offline (1-phone mode) once installed.

## Install on iPhone (PWA — no App Store needed)

1. Open the game URL in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. It appears as a fullscreen app with its own icon.

## Releasing on the iOS App Store (native wrapper)

Requires a **Mac with Xcode** and an **Apple Developer account** ($99/year).

```bash
git clone https://github.com/tahahumam233-blip/cam-pong && cd cam-pong
npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/ios
mkdir www && cp index.html manifest.json sw.js icon-*.png www/
npx cap init "Cam Pong" com.yourname.campong --web-dir=www
npx cap add ios
npx cap open ios     # opens Xcode
```

Then in Xcode:

1. Set your **team** (signing) under *Signing & Capabilities*.
2. Drop `icon-1024.png` into *Assets → AppIcon* (all sizes can be generated from it).
3. Product → Archive → **Distribute App** → App Store Connect.
4. In [App Store Connect](https://appstoreconnect.apple.com): create the app
   listing, add screenshots, and submit for review.

Notes for review approval:

- Apple rejects "just a website in a wrapper" — the offline 1-phone mode and
  native fullscreen behavior help, but consider adding haptics
  (`@capacitor/haptics` on ball hits) to feel more native.
- The multiplayer signaling uses the free public PeerJS broker
  (`0.peerjs.com`). For a store release, run your own
  [PeerServer](https://github.com/peers/peerjs-server) (one-liner on any free
  Node host) and pass its host in `new Peer(id, {host: ...})`.

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire game (canvas, physics, networking, UI) |
| `manifest.json` | PWA manifest (fullscreen, portrait, icons) |
| `sw.js` | Service worker: offline cache, network-first page updates |
| `icon-*.png` | App icons (180 = iOS home screen, 1024 = App Store) |
| `make_icons.py` | Regenerates the icons (Python + Pillow) |
