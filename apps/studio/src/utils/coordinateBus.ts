export type CursorCoordinates = { x: number; y: number } | null;

type CoordinateListener = (coords: CursorCoordinates) => void;

class CoordinateBus {
  private listeners: Set<CoordinateListener> = new Set();
  private currentCoords: CursorCoordinates = null;

  subscribe(listener: CoordinateListener): () => void {
    this.listeners.add(listener);
    // Immediate callback with current state if available
    listener(this.currentCoords);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(coords: CursorCoordinates): void {
    this.currentCoords = coords;
    for (const listener of this.listeners) {
      listener(coords);
    }
  }

  get(): CursorCoordinates {
    return this.currentCoords;
  }
}

export const coordinateBus = new CoordinateBus();
