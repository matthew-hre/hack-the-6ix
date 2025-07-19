# WIP: Spider

a vocally created web of ideas

## Features

- Create a "session"
- Begin speaking: content is transcribed live
- Speakers are identified via Real Time Diarization
- Content is parsed: "problems" and "solutions"
- Content is visual: items appear on the screen and are maluable
- Content is connected: associated problems / solutions are connected via edges
- Sessions are saved and loaded at will

## App Flow

1. A session is created
2. Transcription is enabled. A dotgrid background is visible, with a floating
   menu for audio settings in the bottom-left, and the live conversation being
   transcribed in the bottom-right
3. As conversations are spoken, "Chunks" of that conversation are being sent to
   our backend, responsible for handling all our data processing (for this doc,
   we will refer to it as "The Model")
4. The Model parses out the provided Chunk and sees if anything inside it is a
   question or a solution
5. If it's a question, it verifies it does not exist in the document, and if so,
   adds it. If it does exist, it adds any addition, not-already-present
   information.
6. If it's a solution, the Model discerns whether the question exists or not. If
   it does, it adds any additional detail. If it does not, it adds it.
7. Every few seconds, poll each question in the document against all the
   solutions in the dashboard, and look for possible connections (via Cohere
   Rerank). If it's relevant, draw a labelled connection.

## Order of Operations

- [ ] Scaffold out a basic app
  - [x] Authentication (Github)
  - [x] DB (Postgres w/ Drizzle)
  - [x] Shadcn
  - [x] Husky + lint-staged
- [ ] Create a "canvas"
  - [ ] `/dashboard` shows recent canvases, `/dashboard/[id]` shows the exact
        session
  - [ ] Create "items" on the canvas
  - [ ] Items can be "problems" or "solutions"
  - [ ] Items are draggable and droppable
  - [ ] Items can be editable via text content
- [ ] Diarization
  - [ ] Hook up Azure RTD for speaker identification and transcription
  - [ ] Start recording audio via front-end
  - [ ] Transcribed audio displayed back to front-end
- [ ] Data Parsing
  - [ ] Transcribed chunks sent to Vellum
  - [ ] Vellum discerns between problems and solutions
  - [ ] Vellum checks existing data for detected problem / solution
    - [ ] Existing items are updated with additional information
    - [ ] New items are created and added to the board
- [ ] Connections
  - [ ] Items are ranked against each other and evaluated for relevancy
  - [ ] Connections are saved in the DB
  - [ ] Connections are rendered on the canvas
