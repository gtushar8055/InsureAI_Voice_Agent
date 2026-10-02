import asyncio
import logging
import os
from dotenv import load_dotenv
from google.genai import types

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    WorkerOptions,
    cli,
    function_tool,
    room_io,
)
from livekit.plugins.google import realtime

from rag.loader import load_or_create_vectorstore
from rag.knowledge_retriever import retrieve_and_rerank_knowledge

# -------------------
# Logging & Environment
# -------------------
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env.local"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)

# -------------------
# Tool: Knowledge Base Search
# -------------------
@function_tool
async def search_knowledge_base(question: str) -> str:
    """
    Search the InsureAI Health Insurance knowledge base for policy details, eligibility rules,
    premium information, plan benefits, FAQs, and grounded objection responses.
    Must be called before answering any policy or product question.
    """
    global vectorstore  # use the module-level vectorstore
    logger.info(f"Tool 'search_knowledge_base' called with question: '{question}'")

    if not vectorstore:
        return "Knowledge base is not available."

    retrieved_answer = await asyncio.to_thread(
        retrieve_and_rerank_knowledge,
        question,
        vectorstore,
    )

    if isinstance(retrieved_answer, dict):
        return retrieved_answer.get(
            "formatted_context",
            retrieved_answer.get("answer", "No answer could be found.")
        )
    return "No valid answer returned from knowledge base."

# -------------------
# LiveKit Entry Point
# -------------------
async def entrypoint(ctx: JobContext):
    global vectorstore

    await ctx.connect()
    participant = await ctx.wait_for_participant()
    participant_name = (participant.identity or "there").strip() or "there"
    logger.info("InsureAI — Aria agent connected to LiveKit room.")

    if not vectorstore or not hasattr(vectorstore, "similarity_search_with_score"):
        logger.error("Vectorstore could not be loaded or is invalid.")
        return

    agent = Agent(
        instructions=f"""
            You are Aria, a friendly and professional AI voice advisor for InsureAI Health Insurance.
            Your primary goal is to qualify leads for health insurance plans.
            The customer's exact name is '{participant_name}'. Always call the customer by this name.
            Never invent or replace the customer's name with another name.

            ## Greeting
            Start by warmly greeting the user by name and explaining you will ask a few quick questions
            to help find the best plan for them.

            ## Qualification Flow (collect in order, one question at a time)
            1. Age and location (state/region)
            2. Coverage type needed: individual, family, or group
            3. Monthly budget range
            4. Any pre-existing medical conditions (keep it brief and non-invasive)
            5. Preferred start date

            ## Knowledge Base Usage
            - ALWAYS use the `search_knowledge_base` tool before answering any policy, pricing,
              benefit, eligibility, or FAQ question.
            - Never invent policy details, coverage limits, or premium amounts. If the knowledge
              base does not contain the answer, say clearly:
              "I don't have that specific information on hand right now. Let me arrange for a
               specialist to follow up with you."

            ## Objection Handling
            - Use `search_knowledge_base` to retrieve grounded objection responses.
            - Common objections: "too expensive", "already have insurance", "need to think about it"
            - Acknowledge the concern empathetically, then provide a factual, KB-grounded response.

            ## Out-of-Scope Questions
            - If a question is outside health insurance (e.g., car insurance, investments), say:
              "That's outside my area of expertise for today. I can connect you with the right
               specialist if you'd like."

            ## Human Escalation
            - If the user asks to speak to a human or says "agent" / "representative" / "person",
              respond: "Of course! I'm transferring you to a licensed advisor now. Please hold
              for just a moment." Then end the session gracefully.

            ## Tone & Style
            - Conversational, warm, concise. Do not read long lists aloud.
            - Confirm details back to the user before summarizing qualification.
            - Use the user's name naturally in conversation.
        """,
        tools=[search_knowledge_base],
    )


    session = AgentSession(
        llm=realtime.RealtimeModel(
            model="gemini-2.5-flash-native-audio-preview-12-2025",
            temperature=0.7,
            thinking_config=types.ThinkingConfig(include_thoughts=False),
            input_audio_transcription={},
            output_audio_transcription={},
        ),
    )

    await session.start(
        agent=agent,
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(sample_rate=16000),
            audio_output=room_io.AudioOutputOptions(sample_rate=24000),
        ),
    )

# -------------------
# Run CLI App
# -------------------
if __name__ == "__main__":
    vectorstore = load_or_create_vectorstore()

    if vectorstore and hasattr(vectorstore, "similarity_search_with_score"):
        logger.info(f"Vectorstore loaded successfully: {type(vectorstore)}")
    else:
        logger.error("Vectorstore could not be loaded or is invalid.")
        exit(1)

    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            num_idle_processes=0,
            port=int(os.getenv("PORT", "8081")),
        )
    )
