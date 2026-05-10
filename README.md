# Braynr

A reading accessibility tool designed for users with dyslexia. Braynr combines adaptive typography, AI-powered comprehension quizzes, eye tracking, and meme-based memory aids to make reading easier and more engaging.

## Features

### Reading Area
- Load any `.txt` file or use the built-in sample text
- Drag-and-drop file support
- Dyslexia-friendly font (OpenDyslexic)
- Adjustable letter spacing, word spacing, line height, and column width

### Sidebar Controls
- **Display** — typography knobs (letter spacing, word spacing, line height, column width)
- **Overlays** — color tint overlays (Yellow, Blue, Rose) and a focus mask that dims text above and below the current reading line
- **Modes** — quick access to Rhythmic and Eye Tracking modes
- **Keywords** — highlight words or phrases in the text; each keyword gets a color knob and appears highlighted throughout the document

### Keyword Highlighting
Select any text in the reading area and click the **Add keyword** button that appears. Keywords are stored in the sidebar with four color options (Yellow, Blue, Rose, Green) and highlighted inline in the text.

### Rhythmic Mode (RSVP)
Full-screen word-by-word reading mode. Words flash at a configurable BPM (20–120). Adjustable speed with pause/resume.

### Eye Tracking Mode
Uses [WebGazer.js](https://webgazer.cs.brown.edu/) to track gaze via webcam. A 9-point calibration screen maps eye position to screen coordinates. After calibration the text is displayed with a gaze dot overlay for assisted reading. Requires Chrome or Edge and webcam access.

### Tutor Mode
Toggle per-paragraph AI comprehension quizzes. After each paragraph (except the title), a **Quiz this paragraph** button generates a short open-ended question using Groq. The user answers by voice (Web Speech API), and the AI evaluates the answer with encouraging feedback. Wrong answers trigger a meme to help remember the correct concept.

### Test Mode (Prof)
A full-screen final quiz on the entire text. Generates 3 open-ended questions, optionally steered toward highlighted keywords. Voice answers are transcribed and evaluated. At the end, instead of a score, the AI provides personalised encouraging feedback on what to review.

### Meme Helper
When a quiz answer is wrong, a **Generate a meme to remember this** button appears. It calls the Groq API to pick a meme template and write punchy top/bottom text referencing the correct answer. Templates used: **Drake** and **Woman Yelling at a Cat**, rendered via [memegen.link](https://memegen.link).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| AI | Groq API (`llama-3.3-70b-versatile`) |
| Speech input | Web Speech API |
| Eye tracking | WebGazer.js (MediaPipe Face Mesh + ridge regression) |
| Meme rendering | memegen.link |

## Setup

```bash
npm install
```

Create a `.env.local` file in the project root:

```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

```bash
npm run dev
```

Eye tracking requires Chrome or Edge with webcam permissions granted.

## Notes

- `.env.local` is gitignored — never commit your API key
- Speech recognition works in Chrome and Edge only (Web Speech API)
- WebGazer is served locally from `/public/webgazer.js` to avoid CDN and bundler issues
