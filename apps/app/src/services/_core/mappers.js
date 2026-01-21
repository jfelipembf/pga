/**
 * Firestore Document Mapping Utilities
 * 
 * Centralized functions for mapping Firestore documents to plain objects.
 * Use these instead of inline `.map(d => ({ id: d.id, ...d.data() }))` patterns.
 */

/**
 * Maps a single Firestore document to a plain object with id.
 * @param {DocumentSnapshot} doc - Firestore document snapshot
 * @returns {Object|null} Plain object with id and document data, or null if doc doesn't exist
 */
export const mapFirestoreDoc = (doc) => {
  if (!doc || !doc.exists) return null
  const data = doc.data()
  return Object.assign({ id: doc.id }, data)
}

/**
 * Maps a Firestore query snapshot to an array of plain objects.
 * @param {QuerySnapshot} snapshot - Firestore query snapshot
 * @returns {Array<Object>} Array of plain objects with id and document data
 */
export const mapFirestoreDocs = (snapshot) => {
  if (!snapshot || !snapshot.docs) return []
  return snapshot.docs.map(mapFirestoreDoc).filter(Boolean)
}

/**
 * Alternative mapping that places id at the end (for specific use cases).
 * @param {DocumentSnapshot} doc - Firestore document snapshot
 * @returns {Object|null} Plain object with document data and id at the end
 */
export const mapFirestoreDocIdLast = (doc) => {
  if (!doc || !doc.exists) return null
  const data = doc.data()
  return Object.assign({}, data, { id: doc.id })
}

/**
 * Maps snapshot docs with id at the end.
 * @param {QuerySnapshot} snapshot - Firestore query snapshot
 * @returns {Array<Object>} Array of plain objects with id at the end
 */
export const mapFirestoreDocsIdLast = (snapshot) => {
  if (!snapshot || !snapshot.docs) return []
  return snapshot.docs.map(mapFirestoreDocIdLast).filter(Boolean)
}
