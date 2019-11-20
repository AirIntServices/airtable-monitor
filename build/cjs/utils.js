'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var deepEqual = _interopDefault(require('fast-deep-equal'));

/**
 * Comparison function, handling the following Airtable field types :
 * - link to multiple records
 * - link to single record
 * - lookup
 * - single select
 * - multiple select
 * - date
 * - duration
 * - phone
 * - email
 * - url
 * - number
 * - currency
 * - percent
 * - count
 * - rating
 * - single line text
 * - long text
 * - created time
 * - last modified time
 * - checkbox
 * - barcode
 * - attachments
 * - collaborator
 * - formula
 * - rollup
 * @param {*} a - Left comparison operand.
 * @param {*} b - Right comparison operand.
 */
const airtableFieldValuesAreEqual = (a, b) => {
  // If one of the values is falsy and not the other, they're not equal
  if ((!a && b) || (!b && a)) return false;
  // If they are not of the same type, they're not equal
  // This can happen if a field type changed since the last check
  if (typeof a !== typeof b) return false;
  // Array type fields : link to other records, lookup, multiple select, attachments
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    if (a.length + b.length === 0) return true; // Both arrays are empty (length can't be negative)
    // Comparison for arrays of objects (i.e. attachments)
    if (typeof a[0] === 'object') {
      return a.every((e, index) => deepEqual(e, b[index]));
    }
    // For all other types, check if both arrays contain the same items
    return a.every(e => b.includes(e));
  }
  // Object type fields : barcode, collaborator
  if (a && b && typeof a === 'object') {
    return deepEqual(a, b);
  }
  // Behaves as a simple === for non-arrays
  return a === b;
};

/**
 * Sequentially performs an async function on every item of an array.
 * @param {Array} inputArray - The input array.
 * @param {function} func - Async function that will be executed for each element in the input array.
 */
const chainPromises = (inputArray, func) =>
  inputArray.reduce(
    (promise, item) => promise.then(() => func(item)),
    Promise.resolve(),
  );

/**
 * Returns a promise that will resolve after the given delay.
 * @param {number} delay - The number of milliseconds to wait for.
 */
const waitFor = delay =>
  new Promise(resolve => setTimeout(resolve, delay));

exports.airtableFieldValuesAreEqual = airtableFieldValuesAreEqual;
exports.chainPromises = chainPromises;
exports.waitFor = waitFor;
