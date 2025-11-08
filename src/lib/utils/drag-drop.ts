/**
 * Drag and Drop Utilities / Sürüklə və Burax Utility-ləri
 * Utilities for drag and drop functionality
 * Sürüklə və burax funksionallığı üçün utility-lər
 */

export interface DragItem {
  id: string;
  index: number;
}

export const reorderArray = <T>(
  list: T[],
  startIndex: number,
  endIndex: number
): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

