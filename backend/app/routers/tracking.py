import asyncio
import json
from typing import Dict, List

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.job import GPSPoint
from ..models.user import User, UserRole
from ..schemas.job import LocationUpdate
from ..utils.auth import get_current_user, require_roles

router = APIRouter()

# In-memory store: technician_id -> latest location payload
_technician_locations: Dict[int, dict] = {}
# Connected manager websockets
_manager_connections: List[WebSocket] = []


@router.post("/location")
def push_location(
    body: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    point = GPSPoint(
        technician_id=current_user.id,
        job_id=body.job_id,
        latitude=body.latitude,
        longitude=body.longitude,
        accuracy=body.accuracy,
    )
    db.add(point)
    db.commit()

    payload = {
        "technician_id": current_user.id,
        "name": current_user.name,
        "lat": body.latitude,
        "lng": body.longitude,
        "accuracy": body.accuracy,
        "job_id": body.job_id,
    }
    _technician_locations[current_user.id] = payload

    # Broadcast to connected manager websockets (fire-and-forget)
    asyncio.ensure_future(_broadcast(payload))
    return {"status": "ok"}


@router.get("/live")
def get_live_locations(_: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))):
    return list(_technician_locations.values())


@router.websocket("/ws")
async def tracking_websocket(websocket: WebSocket):
    await websocket.accept()
    _manager_connections.append(websocket)
    try:
        # Send current state immediately on connect
        await websocket.send_text(json.dumps({
            "type": "init",
            "locations": list(_technician_locations.values()),
        }))
        while True:
            # Keep connection alive; client can send ping
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in _manager_connections:
            _manager_connections.remove(websocket)


async def _broadcast(payload: dict):
    message = json.dumps({"type": "location_update", "data": payload})
    dead = []
    for ws in _manager_connections:
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in _manager_connections:
            _manager_connections.remove(ws)
