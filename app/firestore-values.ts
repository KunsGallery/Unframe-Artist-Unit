// Firestore rejects undefined, including nested array fields. Leave Timestamp,
// FieldValue, Date and other SDK objects untouched.
export function firestoreValues<T>(value: T): T {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined).map(firestoreValues) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, firestoreValues(item)])) as T;
  }
  return value;
}
