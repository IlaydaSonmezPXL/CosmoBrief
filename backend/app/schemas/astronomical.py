from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class AstronomicalEvent(BaseModel):
    id: str
    name: str
    type: str  # meteor_shower | planet | moon | eclipse | solstice
    date: str  # YYYY-MM-DD
    time_hint: Optional[str] = None
    direction: Optional[str] = None  # compass: N, NE, E, ...
    altitude: Optional[float] = None  # degrees above horizon
    azimuth: Optional[float] = None  # degrees from N, clockwise
    description: str


class AstronomicalEventsResponse(BaseModel):
    events: List[AstronomicalEvent]
    location_used: bool
