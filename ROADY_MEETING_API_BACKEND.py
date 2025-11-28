"""
ROADY Meeting Rooms - Backend API
FastAPI + WebSocket Implementation
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime
from pydantic import BaseModel
import asyncio
import json
import uuid

# ═══════════════════════════════════════════════════════════════════════════
# MODELS & SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class CreateMeetingRequest(BaseModel):
    name: str
    agent_ids: List[str]
    mode: str = "round-robin"  # round-robin, free, moderated, hierarchical
    tokens_limit: int = 20000
    cost_limit: float = 5.00
    project_id: Optional[str] = None
    task_id: Optional[str] = None

class SendMessageRequest(BaseModel):
    content: str
    target_agent_id: Optional[str] = None

class AddParticipantRequest(BaseModel):
    agent_id: str

class OptimizeRequest(BaseModel):
    type: str  # compression, pruning, summarization

# ═══════════════════════════════════════════════════════════════════════════
# WEBSOCKET CONNECTION MANAGER
# ═══════════════════════════════════════════════════════════════════════════

class ConnectionManager:
    """Manage WebSocket connections for real-time meeting updates"""
    
    def __init__(self):
        # meeting_id -> list of websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, meeting_id: str):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        self.active_connections[meeting_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, meeting_id: str):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id].remove(websocket)
    
    async def broadcast(self, meeting_id: str, message: dict):
        """Broadcast message to all connections in a meeting"""
        if meeting_id in self.active_connections:
            for connection in self.active_connections[meeting_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# ═══════════════════════════════════════════════════════════════════════════
# APP INITIALIZATION
# ═══════════════════════════════════════════════════════════════════════════

app = FastAPI(title="ROADY Meeting Rooms API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════════
# MEETING MANAGEMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/meetings")
async def create_meeting(request: CreateMeetingRequest):
    """Create a new meeting room"""
    
    meeting_id = str(uuid.uuid4())
    
    # Create meeting in database
    meeting = {
        "id": meeting_id,
        "name": request.name,
        "status": "active",
        "mode": request.mode,
        "tokens_limit": request.tokens_limit,
        "tokens_used": 0,
        "cost_limit": request.cost_limit,
        "cost_so_far": 0.0,
        "started_at": datetime.utcnow().isoformat(),
        "participants": [],
        "messages": [],
        "project_id": request.project_id,
        "task_id": request.task_id
    }
    
    # Add agents as participants
    for agent_id in request.agent_ids:
        agent = get_agent(agent_id)  # Your function to get agent from DB
        if agent:
            meeting["participants"].append({
                "id": agent.agent_id,
                "name": agent.agent_name,
                "department": agent.department,
                "status": "active"
            })
    
    # Save to database
    save_meeting(meeting)  # Your function to save meeting
    
    return {"meeting_id": meeting_id, "meeting": meeting}


@app.get("/api/meetings/{meeting_id}")
async def get_meeting(meeting_id: str):
    """Get meeting details"""
    
    meeting = get_meeting_from_db(meeting_id)  # Your function
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    return meeting


@app.get("/api/meetings")
async def list_meetings(status: Optional[str] = None, limit: int = 50):
    """List all meetings"""
    
    meetings = get_meetings_from_db(status=status, limit=limit)
    return {"meetings": meetings}


@app.post("/api/meetings/{meeting_id}/pause")
async def pause_meeting(meeting_id: str):
    """Pause a meeting"""
    
    meeting = get_meeting_from_db(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Update status
    update_meeting_status(meeting_id, "paused")
    
    # Broadcast to all participants
    await manager.broadcast(meeting_id, {
        "type": "meeting_paused",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"status": "paused"}


@app.post("/api/meetings/{meeting_id}/end")
async def end_meeting(meeting_id: str):
    """End a meeting and generate summary"""
    
    meeting = get_meeting_from_db(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Update status
    update_meeting_status(meeting_id, "ended")
    meeting["ended_at"] = datetime.utcnow().isoformat()
    
    # Generate AI summary
    summary = await generate_meeting_summary(meeting)
    meeting["summary"] = summary
    
    # Extract action items
    action_items = await extract_action_items(meeting)
    meeting["action_items"] = action_items
    
    # Save final meeting
    save_meeting(meeting)
    
    # Broadcast to all participants
    await manager.broadcast(meeting_id, {
        "type": "meeting_ended",
        "summary": summary,
        "action_items": action_items
    })
    
    return {
        "status": "ended",
        "summary": summary,
        "action_items": action_items,
        "final_cost": meeting["cost_so_far"],
        "final_tokens": meeting["tokens_used"]
    }

# ═══════════════════════════════════════════════════════════════════════════
# MESSAGE HANDLING
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/meetings/{meeting_id}/messages")
async def send_message(meeting_id: str, request: SendMessageRequest):
    """Send a message in the meeting and get agent responses"""
    
    meeting = get_meeting_from_db(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if meeting["status"] != "active":
        raise HTTPException(status_code=400, detail="Meeting is not active")
    
    # Create user message
    user_message = {
        "id": str(uuid.uuid4()),
        "sender_id": "user",
        "sender_type": "user",
        "sender_name": "You",
        "content": request.content,
        "timestamp": datetime.utcnow().isoformat(),
        "tokens": count_tokens(request.content),
        "cost": 0.0
    }
    
    # Save user message
    meeting["messages"].append(user_message)
    
    # Broadcast user message
    await manager.broadcast(meeting_id, {
        "type": "new_message",
        "message": user_message,
        "tokensUsed": meeting["tokens_used"],
        "costSoFar": meeting["cost_so_far"]
    })
    
    # Get agent responses based on meeting mode
    if meeting["mode"] == "round-robin":
        responses = await handle_round_robin_responses(meeting, request.content)
    elif meeting["mode"] == "free":
        responses = await handle_free_discussion_responses(meeting, request.content)
    elif meeting["mode"] == "moderated":
        responses = await handle_moderated_responses(
            meeting, request.content, request.target_agent_id
        )
    elif meeting["mode"] == "hierarchical":
        responses = await handle_hierarchical_responses(meeting, request.content)
    
    # Add agent responses to meeting
    for response in responses:
        meeting["messages"].append(response)
        meeting["tokens_used"] += response["tokens"]
        meeting["cost_so_far"] += response["cost"]
        
        # Broadcast each agent response
        await manager.broadcast(meeting_id, {
            "type": "new_message",
            "message": response,
            "tokensUsed": meeting["tokens_used"],
            "costSoFar": meeting["cost_so_far"]
        })
    
    # Check limits
    if meeting["tokens_used"] >= meeting["tokens_limit"]:
        await manager.broadcast(meeting_id, {
            "type": "token_limit_reached",
            "message": "Token limit reached. Meeting will end soon."
        })
    
    if meeting["cost_so_far"] >= meeting["cost_limit"]:
        await manager.broadcast(meeting_id, {
            "type": "cost_limit_reached",
            "message": "Cost limit reached. Meeting will end soon."
        })
    
    # Save updated meeting
    save_meeting(meeting)
    
    return {
        "user_message": user_message,
        "agent_responses": responses,
        "tokens_used": meeting["tokens_used"],
        "cost_so_far": meeting["cost_so_far"]
    }


async def handle_round_robin_responses(meeting: dict, user_message: str) -> List[dict]:
    """Each agent responds in turn"""
    responses = []
    
    # Get next agent in rotation
    current_speaker_index = meeting.get("current_speaker_index", -1)
    next_index = (current_speaker_index + 1) % len(meeting["participants"])
    meeting["current_speaker_index"] = next_index
    
    agent = meeting["participants"][next_index]
    response = await get_agent_response(
        agent["id"],
        user_message,
        meeting["messages"]
    )
    
    responses.append(response)
    return responses


async def handle_free_discussion_responses(meeting: dict, user_message: str) -> List[dict]:
    """AI determines which agents should respond"""
    
    # Use LLM to determine relevance
    relevant_agents = await determine_relevant_agents(
        user_message,
        meeting["participants"]
    )
    
    responses = []
    for agent in relevant_agents:
        response = await get_agent_response(
            agent["id"],
            user_message,
            meeting["messages"]
        )
        responses.append(response)
    
    return responses


async def handle_moderated_responses(
    meeting: dict, 
    user_message: str, 
    target_agent_id: Optional[str]
) -> List[dict]:
    """User specifies which agent should respond"""
    
    if not target_agent_id:
        return []
    
    agent = next(
        (a for a in meeting["participants"] if a["id"] == target_agent_id),
        None
    )
    
    if not agent:
        return []
    
    response = await get_agent_response(
        agent["id"],
        user_message,
        meeting["messages"]
    )
    
    return [response]


async def handle_hierarchical_responses(meeting: dict, user_message: str) -> List[dict]:
    """L1 directors coordinate, L2 specialists execute"""
    
    # Get L1 directors first
    l1_agents = [a for a in meeting["participants"] if is_l1_agent(a["id"])]
    l2_agents = [a for a in meeting["participants"] if not is_l1_agent(a["id"])]
    
    responses = []
    
    # L1 provides direction
    if l1_agents:
        director_response = await get_agent_response(
            l1_agents[0]["id"],
            user_message,
            meeting["messages"]
        )
        responses.append(director_response)
    
    # L2 agents execute based on L1 direction
    for agent in l2_agents[:2]:  # Limit to 2 L2 responses
        response = await get_agent_response(
            agent["id"],
            user_message + "\n\nDirector's guidance: " + director_response["content"],
            meeting["messages"]
        )
        responses.append(response)
    
    return responses


async def get_agent_response(
    agent_id: str, 
    user_message: str, 
    conversation_history: List[dict]
) -> dict:
    """Get response from an agent using their configured LLM"""
    
    agent = get_agent(agent_id)
    
    # Build context from conversation history
    context = build_context(conversation_history, agent_id)
    
    # Call LLM (use your LLM router)
    from llm_router import LLMRouter
    router = LLMRouter(database_session=None)
    
    response = router.execute_with_fallback(
        agent_id=agent_id,
        prompt=f"{context}\n\nUser: {user_message}\n\n{agent.agent_name}:",
        task_id="meeting_message"
    )
    
    return {
        "id": str(uuid.uuid4()),
        "sender_id": agent_id,
        "sender_type": "agent",
        "sender_name": agent.agent_name,
        "content": response.content,
        "timestamp": datetime.utcnow().isoformat(),
        "tokens": response.total_tokens,
        "cost": response.cost_usd
    }

# ═══════════════════════════════════════════════════════════════════════════
# PARTICIPANT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/meetings/{meeting_id}/participants")
async def add_participant(meeting_id: str, request: AddParticipantRequest):
    """Add an agent to the meeting"""
    
    meeting = get_meeting_from_db(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if len(meeting["participants"]) >= 8:
        raise HTTPException(status_code=400, detail="Maximum 8 participants allowed")
    
    agent = get_agent(request.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check if already in meeting
    if any(p["id"] == request.agent_id for p in meeting["participants"]):
        raise HTTPException(status_code=400, detail="Agent already in meeting")
    
    # Add participant
    participant = {
        "id": agent.agent_id,
        "name": agent.agent_name,
        "department": agent.department,
        "status": "active"
    }
    meeting["participants"].append(participant)
    save_meeting(meeting)
    
    # Broadcast to all participants
    await manager.broadcast(meeting_id, {
        "type": "agent_joined",
        "agent": participant
    })
    
    return {"participant": participant}


@app.delete("/api/meetings/{meeting_id}/participants/{agent_id}")
async def remove_participant(meeting_id: str, agent_id: str):
    """Remove an agent from the meeting"""
    
    meeting = get_meeting_from_db(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Remove participant
    meeting["participants"] = [
        p for p in meeting["participants"] if p["id"] != agent_id
    ]
    save_meeting(meeting)
    
    # Broadcast to all participants
    await manager.broadcast(meeting_id, {
        "type": "agent_left",
        "agentId": agent_id
    })
    
    return {"status": "removed"}

# ═══════════════════════════════════════════════════════════════════════════
# TOKEN OPTIMIZATION
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/meetings/{meeting_id}/optimize")
async def optimize_tokens(meeting_id: str, request: OptimizeRequest):
    """Apply token optimization strategy"""
    
    meeting = get_meeting_from_db(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if request.type == "compression":
        result = await compress_history(meeting)
    elif request.type == "pruning":
        result = await prune_context(meeting)
    elif request.type == "summarization":
        result = await enable_summarization(meeting)
    else:
        raise HTTPException(status_code=400, detail="Invalid optimization type")
    
    save_meeting(meeting)
    
    # Broadcast optimization applied
    await manager.broadcast(meeting_id, {
        "type": "optimization_applied",
        "optimization": request.type,
        "result": result
    })
    
    return result


async def compress_history(meeting: dict) -> dict:
    """Compress meeting history to save tokens"""
    
    # Get last 20 messages
    messages_to_compress = meeting["messages"][-20:]
    
    # Use LLM to summarize
    summary_prompt = f"""
    Summarize this meeting conversation concisely:
    
    {format_messages_for_summary(messages_to_compress)}
    
    Provide a brief summary in 2-3 paragraphs covering:
    - Main topics discussed
    - Key decisions made
    - Current action items
    """
    
    # Call LLM for summary
    from llm_router import LLMRouter
    router = LLMRouter(database_session=None)
    response = router.execute_with_fallback(
        agent_id="core_orchestrator",
        prompt=summary_prompt,
        task_id="compress_history"
    )
    
    # Replace messages with summary
    summary_message = {
        "id": str(uuid.uuid4()),
        "sender_id": "system",
        "sender_type": "system",
        "sender_name": "System",
        "content": f"[History Summary]\n\n{response.content}",
        "timestamp": datetime.utcnow().isoformat(),
        "tokens": response.total_tokens,
        "cost": response.cost_usd
    }
    
    # Calculate savings
    original_tokens = sum(m["tokens"] for m in messages_to_compress)
    saved_tokens = original_tokens - response.total_tokens
    
    # Keep only last 10 messages + summary
    meeting["messages"] = meeting["messages"][:-20] + [summary_message] + meeting["messages"][-10:]
    
    return {
        "status": "compressed",
        "saved_tokens": saved_tokens,
        "compression_cost": response.cost_usd,
        "net_savings": calculate_cost_from_tokens(saved_tokens) - response.cost_usd
    }


async def prune_context(meeting: dict) -> dict:
    """Enable context pruning for future messages"""
    
    meeting["context_pruning_enabled"] = True
    
    return {
        "status": "enabled",
        "message": "Context pruning enabled. Agents will only receive relevant context."
    }


async def enable_summarization(meeting: dict) -> dict:
    """Enable automatic message summarization"""
    
    meeting["auto_summarization_enabled"] = True
    meeting["summarization_threshold"] = 500  # tokens
    
    return {
        "status": "enabled",
        "message": "Auto-summarization enabled for messages >500 tokens"
    }

# ═══════════════════════════════════════════════════════════════════════════
# WEBSOCKET ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════

@app.websocket("/meetings/{meeting_id}/ws")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str):
    """WebSocket connection for real-time meeting updates"""
    
    await manager.connect(websocket, meeting_id)
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            
            # Handle ping/pong
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, meeting_id)


# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def count_tokens(text: str) -> int:
    """Estimate token count (rough estimate)"""
    # More accurate: use tiktoken library
    return len(text.split()) * 1.3  # Rough estimate


def build_context(messages: List[dict], agent_id: str, max_tokens: int = 3000) -> str:
    """Build context from conversation history"""
    
    # Get recent relevant messages
    context_messages = []
    total_tokens = 0
    
    for msg in reversed(messages):
        if total_tokens + msg["tokens"] > max_tokens:
            break
        context_messages.insert(0, msg)
        total_tokens += msg["tokens"]
    
    # Format as conversation
    context = ""
    for msg in context_messages:
        context += f"{msg['sender_name']}: {msg['content']}\n\n"
    
    return context


async def determine_relevant_agents(message: str, participants: List[dict]) -> List[dict]:
    """Use AI to determine which agents should respond"""
    
    # Simple heuristic for now - can be enhanced with LLM
    relevant = []
    
    # Check for @mentions
    for agent in participants:
        if f"@{agent['name'].lower().replace(' ', '_')}" in message.lower():
            relevant.append(agent)
    
    # If no mentions, let 1-2 most relevant agents respond
    if not relevant:
        # Use LLM or heuristics to determine relevance
        # For now, just return first 2
        relevant = participants[:2]
    
    return relevant


def calculate_cost_from_tokens(tokens: int) -> float:
    """Calculate cost from token count (rough estimate)"""
    # Average of $3/1M input + $15/1M output for Claude Sonnet
    avg_price_per_1m = 9.0
    return (tokens / 1_000_000) * avg_price_per_1m


async def generate_meeting_summary(meeting: dict) -> str:
    """Generate AI summary of the meeting"""
    
    # Format all messages
    transcript = format_messages_for_summary(meeting["messages"])
    
    prompt = f"""
    Generate a comprehensive summary of this meeting:
    
    {transcript}
    
    Include:
    1. Meeting overview
    2. Key topics discussed
    3. Decisions made
    4. Action items identified
    5. Next steps
    
    Format as a professional meeting summary.
    """
    
    from llm_router import LLMRouter
    router = LLMRouter(database_session=None)
    response = router.execute_with_fallback(
        agent_id="core_orchestrator",
        prompt=prompt,
        task_id="meeting_summary"
    )
    
    return response.content


async def extract_action_items(meeting: dict) -> List[dict]:
    """Extract action items from meeting"""
    
    transcript = format_messages_for_summary(meeting["messages"])
    
    prompt = f"""
    Extract all action items from this meeting transcript:
    
    {transcript}
    
    For each action item, provide:
    - Description
    - Assigned to (agent or person)
    - Priority
    - Due date (if mentioned)
    
    Return as JSON list.
    """
    
    from llm_router import LLMRouter
    router = LLMRouter(database_session=None)
    response = router.execute_with_fallback(
        agent_id="core_orchestrator",
        prompt=prompt,
        task_id="extract_actions"
    )
    
    try:
        import json
        return json.loads(response.content)
    except:
        return []


def format_messages_for_summary(messages: List[dict]) -> str:
    """Format messages for summary/extraction"""
    formatted = ""
    for msg in messages:
        formatted += f"{msg['sender_name']} ({msg['timestamp']}): {msg['content']}\n\n"
    return formatted


# Placeholder functions - implement with your database
def get_agent(agent_id: str):
    """Get agent from database"""
    pass

def get_meeting_from_db(meeting_id: str):
    """Get meeting from database"""
    pass

def save_meeting(meeting: dict):
    """Save meeting to database"""
    pass

def update_meeting_status(meeting_id: str, status: str):
    """Update meeting status"""
    pass

def get_meetings_from_db(status: Optional[str] = None, limit: int = 50):
    """Get meetings from database"""
    pass

def is_l1_agent(agent_id: str) -> bool:
    """Check if agent is L1 director"""
    pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
