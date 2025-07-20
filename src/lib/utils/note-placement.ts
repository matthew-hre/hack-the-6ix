import type { Note } from "~/lib/db/schema";

/**
 * Configuration for note placement algorithm
 */
const PLACEMENT_CONFIG = {
  // Canvas dimensions in grid units
  CANVAS_WIDTH: 150, // 3000px / 20px grid
  CANVAS_HEIGHT: 150,

  // Default note size in grid units
  DEFAULT_NOTE_WIDTH: 20,
  DEFAULT_NOTE_HEIGHT: 20,

  // Starting position (center of canvas)
  CENTER_X: 75, // CANVAS_WIDTH / 2
  CENTER_Y: 75, // CANVAS_HEIGHT / 2

  // Gap between notes in grid units
  NOTE_GAP: 1,

  // Maximum search radius from center (in grid units)
  MAX_SEARCH_RADIUS: 75,

  // Small random offset to make placement less perfect (in grid units)
  RANDOM_OFFSET: 0.5,
} as const;

/**
 * Check if a position would cause overlap with existing notes
 */
function wouldOverlap(
  x: number,
  y: number,
  width: number,
  height: number,
  existingNotes: Note[],
): boolean {
  return existingNotes.some((note) => {
    // Calculate the required distance between note edges (note gap)
    const minDistanceX = PLACEMENT_CONFIG.NOTE_GAP;
    const minDistanceY = PLACEMENT_CONFIG.NOTE_GAP;

    // Check if rectangles would overlap or be too close
    const newLeft = x;
    const newRight = x + width;
    const newTop = y;
    const newBottom = y + height;

    const existingLeft = note.position.x;
    const existingRight = note.position.x + note.size.width;
    const existingTop = note.position.y;
    const existingBottom = note.position.y + note.size.height;

    // Check if there's sufficient gap between the notes
    const horizontalGap = Math.min(
      Math.abs(newRight - existingLeft),
      Math.abs(existingRight - newLeft),
    );
    const verticalGap = Math.min(
      Math.abs(newBottom - existingTop),
      Math.abs(existingBottom - newTop),
    );

    // Check for overlap or insufficient gap
    const horizontalOverlap = newLeft < existingRight && newRight > existingLeft;
    const verticalOverlap = newTop < existingBottom && newBottom > existingTop;

    if (horizontalOverlap && verticalOverlap) {
      return true; // Direct overlap
    }

    // Check if gap is sufficient when notes are adjacent
    if (horizontalOverlap && verticalGap < minDistanceY) {
      return true; // Too close vertically
    }

    if (verticalOverlap && horizontalGap < minDistanceX) {
      return true; // Too close horizontally
    }

    return false;
  });
}

/**
 * Check if a position is within canvas bounds
 */
function isWithinBounds(x: number, y: number, width: number, height: number): boolean {
  return (
    x >= 0
    && y >= 0
    && x + width <= PLACEMENT_CONFIG.CANVAS_WIDTH
    && y + height <= PLACEMENT_CONFIG.CANVAS_HEIGHT
  );
}

/**
 * Generate positions in a more natural spiral pattern starting from the center
 */
function* spiralPositions(centerX: number, centerY: number): Generator<{ x: number; y: number }> {
  // Start at center
  yield { x: centerX, y: centerY };

  // Collect positions by distance from center to ensure we try closest first
  const positions: Array<{ x: number; y: number; distance: number }> = [];

  // Generate positions in expanding rings, but collect them all first
  for (let radius = 1; radius <= PLACEMENT_CONFIG.MAX_SEARCH_RADIUS; radius++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let y = centerY - radius; y <= centerY + radius; y++) {
        // Only positions on the perimeter of the current radius
        if (
          x === centerX - radius
          || x === centerX + radius
          || y === centerY - radius
          || y === centerY + radius
        ) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          positions.push({ x, y, distance });
        }
      }
    }
  }

  // Sort by distance from center, with small random factor to break ties
  positions.sort((a, b) => {
    const distanceDiff = a.distance - b.distance;
    // Add small random factor (±0.1) to break perfect patterns
    const randomFactor = (Math.random() - 0.5) * 0.2;
    return distanceDiff + randomFactor;
  });

  // Yield positions in order of distance from center
  for (const pos of positions) {
    yield { x: pos.x, y: pos.y };
  }
}

/**
 * Find the optimal position for a new note using spiral search from center
 */
export function findOptimalNotePosition(
  existingNotes: Note[],
  noteWidth: number = PLACEMENT_CONFIG.DEFAULT_NOTE_WIDTH,
  noteHeight: number = PLACEMENT_CONFIG.DEFAULT_NOTE_HEIGHT,
): { x: number; y: number } {
  // If no existing notes, place at center
  if (existingNotes.length === 0) {
    const centerX = PLACEMENT_CONFIG.CENTER_X - Math.floor(noteWidth / 2);
    const centerY = PLACEMENT_CONFIG.CENTER_Y - Math.floor(noteHeight / 2);
    return { x: Math.max(0, centerX), y: Math.max(0, centerY) };
  }

  // Start search from canvas center
  const startX = PLACEMENT_CONFIG.CENTER_X - Math.floor(noteWidth / 2);
  const startY = PLACEMENT_CONFIG.CENTER_Y - Math.floor(noteHeight / 2);

  // Use spiral search to find the closest valid position to center
  for (const position of spiralPositions(startX, startY)) {
    const { x, y } = position;

    // Check if position is within canvas bounds
    if (!isWithinBounds(x, y, noteWidth, noteHeight)) {
      continue;
    }

    // Check if position would overlap with existing notes
    if (!wouldOverlap(x, y, noteWidth, noteHeight, existingNotes)) {
      // Add small random offset to make placement less perfect
      const offsetX = (Math.random() - 0.5) * PLACEMENT_CONFIG.RANDOM_OFFSET;
      const offsetY = (Math.random() - 0.5) * PLACEMENT_CONFIG.RANDOM_OFFSET;

      const finalX = Math.round(x + offsetX);
      const finalY = Math.round(y + offsetY);

      // Ensure the offset position is still valid
      if (
        isWithinBounds(finalX, finalY, noteWidth, noteHeight)
        && !wouldOverlap(finalX, finalY, noteWidth, noteHeight, existingNotes)
      ) {
        return { x: finalX, y: finalY };
      }

      // If offset position is invalid, return original position
      return { x, y };
    }
  }

  // Fallback: if no position found in spiral search, try a simple grid search
  // This should rarely happen given the large search radius
  for (let y = 0; y <= PLACEMENT_CONFIG.CANVAS_HEIGHT - noteHeight; y++) {
    for (let x = 0; x <= PLACEMENT_CONFIG.CANVAS_WIDTH - noteWidth; x++) {
      if (!wouldOverlap(x, y, noteWidth, noteHeight, existingNotes)) {
        return { x, y };
      }
    }
  }

  // Ultimate fallback: place at top-left corner (should never happen)
  return { x: 0, y: 0 };
}

/**
 * Calculate the next available note ID
 */
export function getNextNoteId(existingNotes: Note[]): number {
  if (existingNotes.length === 0)
    return 1;
  const existingIds = existingNotes.map(note => note.id);
  return Math.max(...existingIds) + 1;
}
