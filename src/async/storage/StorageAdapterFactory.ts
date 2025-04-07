import { StorageAdapter } from './StorageAdapter';
import { MemoryStorageAdapter } from './MemoryStorageAdapter';
import { NeDBStorageAdapter } from './NeDBStorageAdapter';
import path from 'path';
import fs from 'fs';
import logger from '../../utils/logger';

/**
 * Storage adapter factory options
 */
export interface StorageAdapterFactoryOptions {
  /**
   * Storage type
   */
  type?: 'memory' | 'nedb';

  /**
   * Path to the database directory (for persistent storage)
   */
  dbPath?: string;

  /**
   * Whether to use in-memory storage only
   */
  inMemoryOnly?: boolean;
}

/**
 * Storage adapter factory
 */
export class StorageAdapterFactory {
  /**
   * Create a storage adapter
   * 
   * @param options Storage adapter factory options
   * @returns Storage adapter
   */
  public static createAdapter(options: StorageAdapterFactoryOptions = {}): StorageAdapter {
    // If in-memory only, use memory storage
    if (options.inMemoryOnly || options.type === 'memory') {
      logger.info('Using in-memory storage');
      return new MemoryStorageAdapter();
    }

    // If no db path, use memory storage
    if (!options.dbPath) {
      logger.info('No database path specified, using in-memory storage');
      return new MemoryStorageAdapter();
    }

    // Create the database directory if it doesn't exist
    try {
      if (!fs.existsSync(options.dbPath)) {
        fs.mkdirSync(options.dbPath, { recursive: true });
      }
    } catch (error) {
      logger.error(`Error creating database directory: ${error instanceof Error ? error.message : String(error)}`);
      logger.info('Falling back to in-memory storage');
      return new MemoryStorageAdapter();
    }

    // Use NeDB storage
    logger.info(`Using NeDB storage at ${options.dbPath}`);
    return new NeDBStorageAdapter(options.dbPath);
  }
}
