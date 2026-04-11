#!/bin/bash
# Record a 60-second gameplay GIF for README
# Usage: ./record_demo.sh
# Requires: ffmpeg (brew install ffmpeg)
#
# Steps:
# 1. Start the game:  npm run dev
# 2. Open a second terminal and run this script
# 3. A 60-second screen recording starts (adjust REGION as needed)
# 4. Output: demo.gif  (optimised palette, ~600px wide, ~10fps)

DURATION=60
OUTPUT_MP4="demo_raw.mp4"
OUTPUT_GIF="demo.gif"
PALETTE="palette.png"

# ── Capture ──────────────────────────────────────────────────────────────────
# macOS: record a 1280×720 window region.
# Move the game window to top-left before running, or adjust -i crop coords.
echo "⏺  Recording ${DURATION}s — switch to the game window NOW"
sleep 2

ffmpeg -y \
  -f avfoundation \
  -framerate 30 \
  -video_size 1280x720 \
  -i "1:none" \
  -t ${DURATION} \
  -c:v libx264 -preset ultrafast \
  "${OUTPUT_MP4}"

# ── Convert to GIF ────────────────────────────────────────────────────────────
echo "🎨  Generating palette…"
ffmpeg -y -i "${OUTPUT_MP4}" \
  -vf "fps=10,scale=600:-1:flags=lanczos,palettegen" \
  "${PALETTE}"

echo "📦  Encoding GIF…"
ffmpeg -y -i "${OUTPUT_MP4}" -i "${PALETTE}" \
  -lavfi "fps=10,scale=600:-1:flags=lanczos [x]; [x][1:v] paletteuse" \
  "${OUTPUT_GIF}"

rm -f "${OUTPUT_MP4}" "${PALETTE}"
echo "✅  Saved: ${OUTPUT_GIF}"
echo "   Drop it into the repo root, then update README.md img src."
