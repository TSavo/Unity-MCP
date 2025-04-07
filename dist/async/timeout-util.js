"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = void 0;
exports.timeout = timeout;
exports.createCancelablePromise = createCancelablePromise;
/**
 * TimeoutError class
 */
class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Timeout a promise after a specified amount of time
 *
 * @param promise Promise to timeout
 * @param options Timeout options
 * @returns Promise that resolves with the result or rejects with a timeout error
 */
function timeout(promise, options) {
    const { milliseconds, message = `Promise timed out after ${milliseconds} milliseconds`, fallback } = options;
    // If milliseconds is Infinity, just return the promise
    if (milliseconds === Infinity) {
        return promise;
    }
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            if (fallback) {
                // If a fallback is provided, resolve with the fallback value
                Promise.resolve(fallback()).then(value => {
                    clearTimeout(timeoutId);
                    resolve(value);
                }).catch(reject);
            }
            else {
                // Otherwise, reject with a timeout error
                reject(new TimeoutError(message));
            }
        }, milliseconds);
        // Ensure the timer is unref'd so it doesn't keep the process alive
        if (timeoutId.unref) {
            timeoutId.unref();
        }
    });
    // Create a promise that resolves when the original promise resolves
    const wrappedPromise = new Promise((resolve, reject) => {
        promise.then(resolve).catch(reject);
    });
    // Race the original promise against the timeout
    return Promise.race([wrappedPromise, timeoutPromise]);
}
/**
 * Resolve variable used by the timeout function
 */
let resolve;
/**
 * Create a cancelable promise
 *
 * @param executor Function that executes the promise
 * @returns Cancelable promise
 */
function createCancelablePromise(executor) {
    let isCanceled = false;
    let cancelHandler = null;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        executor((value) => {
            if (!isCanceled) {
                resolvePromise(value);
            }
        }, (reason) => {
            if (!isCanceled) {
                rejectPromise(reason);
            }
        }, (handler) => {
            cancelHandler = handler;
        });
    });
    const cancelablePromise = promise;
    cancelablePromise.cancel = () => {
        if (isCanceled) {
            return;
        }
        isCanceled = true;
        if (cancelHandler) {
            cancelHandler();
        }
    };
    cancelablePromise.isCanceled = () => isCanceled;
    return cancelablePromise;
}
