"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationStatus = void 0;
/**
 * Operation status enum
 */
var OperationStatus;
(function (OperationStatus) {
    OperationStatus["SUCCESS"] = "success";
    OperationStatus["ERROR"] = "error";
    OperationStatus["TIMEOUT"] = "timeout";
    OperationStatus["CANCELLED"] = "cancelled";
    OperationStatus["RUNNING"] = "running";
    OperationStatus["UNKNOWN"] = "unknown";
})(OperationStatus || (exports.OperationStatus = OperationStatus = {}));
