<p align="right">
  <strong>English</strong> • <a href="./24_AI_VOICEOVER_AND_AUDIO_SYNC_WALKTHROUGH.zh-CN.md">简体中文</a>
</p>

# AI Voiceover Adaptive Duration, Offline Presentation Speech, and Audio Sync Walkthrough
## Stage 5.6 Audio-Kinematics Alignment, Voice Synthesis Whitelisting, and Responsive Waveform Integration

| Metadata | Description |
| :--- | :--- |
| **Specification Version** | `1.0.0` |
| **Last Updated** | `2026-09-08` |
| **Module Scope** | `@focusflow/studio` & `@focusflow/player` (Stage 5.6) |
| **Target Audience** | Audio Engineers, Interactive Media Developers, Frontend Engineers |

---

## 1. Core Design Tenets & Implementation Philosophy

FocusFlow Studio Stage 5.6 establishes two fundamental audiovisual tenets governing narration pacing and playback synchronization:

### 1. Preserve Natural Speech Cadence: Extend When Long, Retain Visual Breathing Pauses When Short
- **Never Unnaturally Stretch Speech**: Both cloud neural voices and offline Web Speech maintain a natural 1.0x baseline velocity. Compressing or pitch-shifting speech sounds mechanical and degrades presentation quality;
- **Adaptive Scene Duration Rule**:
  - **When Dialogue Exceeds Scene Time**: Stretches scene duration automatically to $\text{speechDuration} + 500\text{ms}$ breathing pause, ensuring narration finishes comfortably before camera transitions;
  - **When Dialogue is Short**: Narration plays at normal speed, and the scene **retains its configured duration**, treating the remaining duration as a "visual digestion pause" for audiences to inspect architecture graphics;
  - **Formula**:
    $$\text{duration} = \max(\text{initialDuration},\, T_{\text{audio}} + 500\text{ms},\, \text{cameraDuration} + 500\text{ms})$$

### 2. Seamless Offline Voice Integration & Batch AI Scripting
- **Offline Web Speech API**: Leverages host operating system synthesis engines directly to hardware speakers, eliminating cloud costs and API key setup;
- **Per-Scene Playback Binding**: Hooks into `sceneChange` events during presentation mode to narrate scripts sequentially, pausing cleanly on user demand;
- **Batch Timeline Synchronization**: Clicking `[🤖 AI Voiceover]` loops across all timeline scenes, computing adaptive durations and stitching master tracks in memory;
- **High-Fidelity Cloud Audio Stems**: Allows instant switching to Google Gemini official TTS or OpenAI endpoints for 30+ broadcast-grade neural voices.

---

## 2. Component Modifications & Engineering Checklist

1. **`aiTtsSynthesizer.ts`**:
   - Deployed `adaptSceneDurationToAudio(scene, audioDurationMs, defaultInterval)` enforcing the "extend when long, preserve pause when short" rule;
   - Enhanced `synthesizeSceneVoiceover` to support default scene timing intervals.
2. **`WebSpeechTTSProvider.ts`**:
   - **Purged Novelty Voices**: Explicitly blacklisted vintage toy and novelty voices (`Albert`, `Fred`, `Zarvox`, `Bad News`);
   - **Broadcast Voice Whitelisting**: Guaranteed default selection of **`Samantha`** (macOS modern US English) or **`Jenny`** (Windows) for English, and **`Ting-Ting`** or **`Xiaoxiao`** for Mandarin;
   - **Language Sniffing**: Automatic language detection avoids cross-linguistic phonetic distortion.
3. **`RightInspector.tsx` & `App.tsx` Audition Decoupling**:
   - Introduced ephemeral `TTSPreviewInfo` state enabling creators to preview dialogue and evaluate recommended scene timing before committing changes with `[✓ Apply]`;
   - Integrated immediate interrupt handlers (`[⏹️ Stop]`) to break long preview audio streams instantly.
4. **`GeminiTTSProvider.ts`**:
   - Added automatic 44-byte RIFF WAV framing to unpackaged raw PCM streams emitted by Gemini models (`gemini-3.1-flash-tts-preview`).
5. **`AudioWaveformTrack.tsx`**:
   - Resolved offline track identification heuristics, ensuring physical binary tracks always visualize genuine Web Audio waveform envelopes.

---

## 3. Verification & Automated Test Coverage

The implementation is verified via Playwright end-to-end integration suites (`e2e/stage5-audio-sync.spec.ts`):
- `TC564`: Validates per-scene script input, audition interrupts, and timing adaptation;
- `TC565`: Validates batch AI voiceover compilation and master track stitching;
- `TC570`: Validates synchronized speech dispatching during presentation playback;
- `TC580` & `TC581`: Validates Google Gemini official TTS preset selection, PCM header framing, and audition workflows.
