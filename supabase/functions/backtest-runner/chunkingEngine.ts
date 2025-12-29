/**
 * Chunking Engine for Backtest
 * 
 * Processes backtest in chunks to improve memory and allow progress tracking
 * 
 * Phase 3: Optimization - Task 2
 */

export interface ChunkProgress {
  current: number;
  total: number;
  message: string;
}

export interface ChunkProcessor<T, R> {
  processChunk(chunk: T[], chunkIndex: number, totalChunks: number): Promise<R>;
  onProgress?: (progress: ChunkProgress) => void;
}

/**
 * Process array in chunks
 */
export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: ChunkProcessor<T, R>
): Promise<R[]> {
  const totalChunks = Math.ceil(items.length / chunkSize);
  const results: R[] = [];
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, items.length);
    const chunk = items.slice(start, end);
    
    processor.onProgress?.({
      current: i + 1,
      total: totalChunks,
      message: `Processing chunk ${i + 1}/${totalChunks} (${chunk.length} items)`
    });
    
    const chunkResult = await processor.processChunk(chunk, i, totalChunks);
    results.push(chunkResult);
  }
  
  return results;
}

/**
 * Default chunk size for candles
 */
export const DEFAULT_CANDLE_CHUNK_SIZE = 2000;

