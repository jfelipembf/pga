const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Build Firestore reference for branch collection item
 */
exports.getBranchCollectionRef = (idTenant, idBranch, collection, docId = null) => {
    const ref = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection(collection);

    return docId ? ref.doc(docId) : ref;
};

/**
 * Get staff document reference
 */
exports.getStaffRef = (idTenant, idBranch, uid) => {
    return exports.getBranchCollectionRef(idTenant, idBranch, "staff", uid);
};

/**
 * Get role document reference
 */
exports.getRoleRef = (idTenant, idBranch, roleId) => {
    return exports.getBranchCollectionRef(idTenant, idBranch, "roles", roleId);
};

