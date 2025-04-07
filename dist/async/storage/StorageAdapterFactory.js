"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageAdapterFactory = void 0;
const MemoryStorageAdapter_1 = require("./MemoryStorageAdapter");
const NeDBStorageAdapter_1 = require("./NeDBStorageAdapter");
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Storage adapter factory
 */
class StorageAdapterFactory {
    /**
     * Create a storage adapter
     *
     * @param options Storage adapter factory options
     * @returns Storage adapter
     */
    static createAdapter(options = {}) {
        // If in-memory only, use memory storage
        if (options.inMemoryOnly || options.type === 'memory') {
            logger_1.default.info('Using in-memory storage');
            return new MemoryStorageAdapter_1.MemoryStorageAdapter();
        }
        // If no db path, use memory storage
        if (!options.dbPath) {
            logger_1.default.info('No database path specified, using in-memory storage');
            return new MemoryStorageAdapter_1.MemoryStorageAdapter();
        }
        // Create the database directory if it doesn't exist
        try {
            if (!fs_1.default.existsSync(options.dbPath)) {
                fs_1.default.mkdirSync(options.dbPath, { recursive: true });
            }
        }
        catch (error) {
            logger_1.default.error(`Error creating database directory: ${error instanceof Error ? error.message : String(error)}`);
            logger_1.default.info('Falling back to in-memory storage');
            return new MemoryStorageAdapter_1.MemoryStorageAdapter();
        }
        // Use NeDB storage
        logger_1.default.info(`Using NeDB storage at ${options.dbPath}`);
        return new NeDBStorageAdapter_1.NeDBStorageAdapter(options.dbPath);
    }
}
exports.StorageAdapterFactory = StorageAdapterFactory;
