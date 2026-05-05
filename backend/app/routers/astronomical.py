from __future__ import annotations

import base64
from datetime import date, timedelta
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, Query

from app.config import settings
from app.dependencies import get_current_user
from app.schemas.astronomical import AstronomicalEvent, AstronomicalEventsResponse

router = APIRouter(tags=["astronomical"])

# Annual events — peak date repeats every year
_ANNUAL: list[dict] = [
    {
        "name": "Quadrantids Meteor Shower",
        "month": 1, "day": 3,
        "type": "meteor_shower", "direction": "N", "time_hint": "before dawn",
        "description": "Up to 120 meteors/hr. Radiant near Boötes. Best viewed from northern hemisphere.",
    },
    {
        "name": "Lyrid Meteor Shower",
        "month": 4, "day": 22,
        "type": "meteor_shower", "direction": "E", "time_hint": "after midnight",
        "description": "~20 meteors/hr. Radiant in Lyra near Vega. Active Apr 16–25.",
    },
    {
        "name": "Eta Aquariid Meteor Shower",
        "month": 5, "day": 6,
        "type": "meteor_shower", "direction": "E", "time_hint": "before dawn",
        "description": "Up to 50 meteors/hr. Debris from Halley's Comet. Radiant in Aquarius.",
    },
    {
        "name": "Delta Aquariid Meteor Shower",
        "month": 7, "day": 30,
        "type": "meteor_shower", "direction": "S", "time_hint": "after midnight",
        "description": "~20 meteors/hr. Best from southern latitudes. Radiant in Aquarius.",
    },
    {
        "name": "Perseid Meteor Shower",
        "month": 8, "day": 12,
        "type": "meteor_shower", "direction": "NE", "time_hint": "after midnight",
        "description": "Up to 100 meteors/hr. Summer's best shower. Radiant in Perseus.",
    },
    {
        "name": "Orionid Meteor Shower",
        "month": 10, "day": 21,
        "type": "meteor_shower", "direction": "E", "time_hint": "after midnight",
        "description": "~20 meteors/hr. Halley's Comet debris. Radiant in Orion.",
    },
    {
        "name": "Leonid Meteor Shower",
        "month": 11, "day": 17,
        "type": "meteor_shower", "direction": "E", "time_hint": "after midnight",
        "description": "~15 meteors/hr. Can surge to storms in some years. Radiant in Leo.",
    },
    {
        "name": "Geminid Meteor Shower",
        "month": 12, "day": 13,
        "type": "meteor_shower", "direction": "NE", "time_hint": "all night",
        "description": "Up to 120 meteors/hr. Year's most reliable shower. Radiant in Gemini.",
    },
    {
        "name": "Ursid Meteor Shower",
        "month": 12, "day": 22,
        "type": "meteor_shower", "direction": "N", "time_hint": "after midnight",
        "description": "~10 meteors/hr. Best from high latitudes. Radiant near Polaris.",
    },
    {
        "name": "Spring Equinox",
        "month": 3, "day": 20,
        "type": "solstice", "direction": "E", "time_hint": "all day",
        "description": "Day and night are equal. Sun rises due East, sets due West.",
    },
    {
        "name": "Summer Solstice",
        "month": 6, "day": 21,
        "type": "solstice", "direction": "N", "time_hint": "all day",
        "description": "Longest day of the year. Sun reaches its highest point in the sky.",
    },
    {
        "name": "Autumnal Equinox",
        "month": 9, "day": 23,
        "type": "solstice", "direction": "E", "time_hint": "all day",
        "description": "Day and night are equal. Sun rises due East, sets due West.",
    },
    {
        "name": "Winter Solstice",
        "month": 12, "day": 21,
        "type": "solstice", "direction": "S", "time_hint": "all day",
        "description": "Shortest day of the year. Sun at its lowest arc across the sky.",
    },
]

# One-off fixed events (extend list as needed for future years)
_FIXED: list[dict] = [
    {
        "name": "Total Solar Eclipse",
        "date": "2026-08-12",
        "type": "eclipse", "direction": "S", "time_hint": "daytime",
        "description": "Visible from Greenland, Iceland, Spain, North Africa. Totality up to 2m18s.",
    },
    {
        "name": "Partial Lunar Eclipse",
        "date": "2026-08-28",
        "type": "eclipse", "direction": "E", "time_hint": "after midnight",
        "description": "Moon partially enters Earth's shadow. Visible from Europe, Africa, Asia.",
    },
]

_PLANET_NAMES = {
    "mercury": "Mercury",
    "venus": "Venus",
    "mars": "Mars",
    "jupiter": "Jupiter",
    "saturn": "Saturn",
}

_COMPASS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
]


def _azimuth_to_compass(degrees: float) -> str:
    return _COMPASS[round(degrees / 22.5) % 16]


def _get_curated(days_ahead: int = 90) -> List[AstronomicalEvent]:
    today = date.today()
    cutoff = today + timedelta(days=days_ahead)
    events: List[AstronomicalEvent] = []

    for e in _ANNUAL:
        for year in (today.year, today.year + 1):
            try:
                ev_date = date(year, e["month"], e["day"])
            except ValueError:
                continue
            if today <= ev_date <= cutoff:
                events.append(AstronomicalEvent(
                    id=f"{e['name'].lower().replace(' ', '-')}-{year}",
                    name=e["name"],
                    type=e["type"],
                    date=ev_date.isoformat(),
                    time_hint=e.get("time_hint"),
                    direction=e.get("direction"),
                    description=e["description"],
                ))
                break  # only add closest year

    for e in _FIXED:
        ev_date = date.fromisoformat(e["date"])
        if today <= ev_date <= cutoff:
            events.append(AstronomicalEvent(
                id=f"fixed-{e['date']}",
                name=e["name"],
                type=e["type"],
                date=e["date"],
                time_hint=e.get("time_hint"),
                direction=e.get("direction"),
                description=e["description"],
            ))

    return sorted(events, key=lambda x: x.date)


async def _fetch_planets(lat: float, lon: float) -> List[AstronomicalEvent]:
    today = date.today().isoformat()
    token = base64.b64encode(
        f"{settings.astronomy_app_id}:{settings.astronomy_app_secret}".encode()
    ).decode()

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.astronomyapi.com/api/v2/bodies/positions",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "elevation": 0,
                    "from_date": today,
                    "to_date": today,
                    "time": "21:00:00",
                },
                headers={"Authorization": f"Basic {token}"},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []

    events: List[AstronomicalEvent] = []
    rows = data.get("data", {}).get("table", {}).get("rows", [])
    for row in rows:
        body_id = row.get("entry", {}).get("id", "")
        if body_id not in _PLANET_NAMES:
            continue
        cells = row.get("cells", [])
        if not cells:
            continue
        horiz = cells[0].get("position", {}).get("horizontal", {})
        try:
            alt = float(horiz["altitude"]["degrees"])
            az = float(horiz["azimuth"]["degrees"])
        except (KeyError, TypeError, ValueError):
            continue
        if alt < 10.0:
            continue
        direction = _azimuth_to_compass(az)
        name = _PLANET_NAMES[body_id]
        events.append(AstronomicalEvent(
            id=f"planet-{body_id}-{today}",
            name=name,
            type="planet",
            date=today,
            time_hint="this evening",
            direction=direction,
            altitude=round(alt, 1),
            azimuth=round(az, 1),
            description=f"Visible tonight at 9 pm — look {direction} at {round(alt)}° above the horizon.",
        ))

    return events


@router.get("/astronomical/events", response_model=AstronomicalEventsResponse)
async def get_astronomical_events(
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    _current_user: object = Depends(get_current_user),
) -> AstronomicalEventsResponse:
    curated = _get_curated(days_ahead=90)
    planets: List[AstronomicalEvent] = []
    location_used = lat is not None and lon is not None

    if location_used:
        planets = await _fetch_planets(lat, lon)  # type: ignore[arg-type]

    # Tonight's planets first, then upcoming events by date
    combined = planets + curated
    return AstronomicalEventsResponse(events=combined[:12], location_used=location_used)
