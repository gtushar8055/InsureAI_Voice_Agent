# InsureAI

InsureAI is a knowledge-grounded health-insurance voice assistant built for the AI Engineer Assessment. It lets a customer join a browser voice session, answer qualification questions, ask insurance questions, and receive responses grounded in the local knowledge base.

## Working Flow

1. The React frontend asks the FastAPI service for a LiveKit room token.
2. The customer enters their name and joins the LiveKit room.
3. The LiveKit agent connects to the same room and identifies the customer by name.
4. Gemini Realtime handles the spoken conversation.
5. Policy and FAQ questions call the local Chroma knowledge base through a function tool.
6. Local SentenceTransformers embeddings retrieve relevant records, followed by cross-encoder reranking.
7. The grounded context is returned to Gemini before the answer is spoken.
8. When the call ends, InsureAI shows a conversation output page with the captured transcript.

## Features

- Browser-based LiveKit voice consultation.
- Health-insurance lead qualification flow.
- Grounded FAQ and policy retrieval from `backend/data/rag_ready_faqs_data.jsonl`.
- Local Chroma vector database with 870 indexed records.
- Local `all-MiniLM-L6-v2` document and query embeddings.
- Cross-encoder reranking for retrieved records.
- Unsupported-question fallback instead of invented policy details.
- Human-agent escalation response.
- Correct customer-name handling.
- InsureAI light interface with a post-call transcript summary.

## Project Structure

```text
backend/
  agent.py                  LiveKit and Gemini voice agent
  fastapi_room_endpoint.py  LiveKit token service
  data/                     Knowledge-base source records
  rag/                      Loading, retrieval, embedding, and reranking code
  requirements.txt          Python dependencies

frontend/
  src/App.jsx               InsureAI application shell
  src/components/           LiveKit room and voice assistant UI
  package.json              Frontend scripts and dependencies
```

## Run Locally

Open three PowerShell terminals from the project directory.

### Token service

```powershell
cd backend
python fastapi_room_endpoint.py
```

### LiveKit agent

```powershell
cd backend
python agent.py start
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the frontend terminal, normally `http://localhost:5173`.

## Verification

The current project has been verified with:

```powershell
cd frontend
npm run build
npm run lint
```

The backend has also been syntax-compiled and the FastAPI token endpoint has been smoke-tested successfully.

## Scope

The repository currently implements the assessment's health-insurance voice-agent and connected knowledge-base workflow. It does not yet implement the separate Philippines/Indonesia native-language bots or the real-time call-insights dashboard requirements.
