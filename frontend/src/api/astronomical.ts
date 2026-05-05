import client from "./client";

export interface AstronomicalEvent {
  id: string;
  name: string;
  type: string; // meteor_shower | planet | moon | eclipse | solstice
  date: string; // YYYY-MM-DD
  time_hint?: string;
  direction?: string;
  altitude?: number;
  azimuth?: number;
  description: string;
}

export interface AstronomicalEventsResponse {
  events: AstronomicalEvent[];
  location_used: boolean;
}

export function getAstronomicalEvents(lat?: number, lon?: number) {
  const params: Record<string, string> = {};
  if (lat !== undefined && lon !== undefined) {
    params.lat = lat.toFixed(5);
    params.lon = lon.toFixed(5);
  }
  return client.get<AstronomicalEventsResponse>("/astronomical/events", { params });
}
