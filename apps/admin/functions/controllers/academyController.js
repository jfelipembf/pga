const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { admin, db } = require("../helpers/firebaseAdmin");
const { getNextSequenceValue } = require("../helpers/counterHelper");
const authService = require("../services/authService");
const logger = require("firebase-functions/logger");

/**
 * Check if a slug is available.
 */
exports.checkSlug = onCall(async (request) => {
    const slug = request.data.slug;
    if (!slug) throw new HttpsError("invalid-argument", "Slug is required");

    // Extract the tenant part (before the first slash)
    const tenantSlug = slug.split('/')[0];

    try {
        const slugDoc = await db.collection("tenantsBySlug").doc(tenantSlug).get();
        return { available: !slugDoc.exists };
    } catch (error) {
        throw new HttpsError("internal", error.message);
    }
});

/**
 * Create a new Academy (Tenant + Branch + Owner).
 */
exports.createAcademy = onCall(async (request) => {
    const data = request.data;

    // Basic validation
    if (!data.slug || !data.companyInfo) {
        throw new HttpsError("invalid-argument", "Missing required fields (slug, companyInfo)");
    }

    const { slug, companyInfo, address, owner, newOwners: inputNewOwners = [], ownerAddress, tenantId: existingTenantId, owners = [] } = data;

    try {
        const academiesId = await getNextSequenceValue('academiesId');
        let primaryOwnerUid = null;
        let primaryOwnerData = null; // Data for denormalization (primary only)

        // Normalize single owner to newOwners array
        const newOwnersList = [...inputNewOwners];
        if (owner && owner.email && !newOwnersList.find(o => o.email === owner.email)) {
            newOwnersList.push(owner);
        }

        const createdOwners = [];

        // 1. Handle New Owners
        for (const ownerItem of newOwnersList) {
            if (!ownerItem.email) continue;

            const { uid } = await authService.findOrCreateUser({
                email: ownerItem.email,
                firstName: ownerItem.firstName,
                lastName: ownerItem.lastName,
                phone: ownerItem.phone,
                photo: null
            });

            const ownerInfo = {
                uid,
                firstName: ownerItem.firstName,
                lastName: ownerItem.lastName,
                email: ownerItem.email,
                phone: ownerItem.phone,
                birthdate: ownerItem.birthdate || null,
                gender: ownerItem.gender || null,
                address: ownerAddress || {} // Use common address or ownerItem.address
            };

            await authService.setUserClaims(uid, { role: 'owner' });
            createdOwners.push(ownerInfo);

            if (!primaryOwnerUid) {
                primaryOwnerUid = uid;
                primaryOwnerData = ownerInfo;
            }
        }

        if (!primaryOwnerUid && owners.length > 0) {
            primaryOwnerUid = owners[0];
        }

        const createdOwnerUids = createdOwners.map(o => o.uid);
        const allOwnerUids = [...new Set([...owners, ...createdOwnerUids, primaryOwnerUid].filter(Boolean))];

        // 2. Transaction
        const result = await db.runTransaction(async (transaction) => {
            const slugParts = slug.split('/');
            const tenantSlug = slugParts[0];
            const branchSlug = slugParts[1] || 'unidade-1';

            const slugRef = db.collection("tenantsBySlug").doc(tenantSlug);
            const slugDoc = await transaction.get(slugRef);

            if (slugDoc.exists) {
                const existingMapping = slugDoc.data();
                const mappedTenantId = existingMapping.idTenant || existingMapping.tenantId;

                // If it exists but we are NOT trying to use this existing tenant, it's a conflict
                if (!existingTenantId || mappedTenantId !== existingTenantId) {
                    throw new HttpsError("already-exists", "This tenant slug is already in use.");
                }
            }

            let tenantRef;
            if (existingTenantId) {
                tenantRef = db.collection("tenants").doc(existingTenantId);
                const tenantDoc = await transaction.get(tenantRef);
                if (!tenantDoc.exists) throw new HttpsError("not-found", "Tenant not found");
            } else {
                tenantRef = db.collection("tenants").doc();
            }

            const branchRef = tenantRef.collection("branches").doc();
            const timestamp = admin.firestore.FieldValue.serverTimestamp();

            const tenantData = {
                academiesId,
                name: tenantSlug,
                slug: tenantSlug,
                businessName: companyInfo.businessName,
                tradeName: companyInfo.tradeName,
                cnpj: companyInfo.cnpj,
                email: companyInfo.email,
                phone: companyInfo.phone,
                website: companyInfo.website || null,
                photo: companyInfo.photo || null,
                updatedAt: timestamp
            };

            if (!existingTenantId) {
                tenantData.createdAt = timestamp;
                transaction.set(tenantRef, tenantData);

                // 3. Document the tenant slug mapping (only for new tenants)
                transaction.set(slugRef, {
                    idTenant: tenantRef.id
                });
            } else {
                transaction.update(tenantRef, tenantData);
            }

            // Format Branch Name: "tenantPart - Unit Part" (e.g., "a2 - Unidade 1")
            const formattedBranchPart = branchSlug
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            const branchName = `${tenantSlug} - ${formattedBranchPart}`;

            const branchData = {
                branchId: branchRef.id,
                academiesId,
                tenantId: tenantRef.id,
                ownerUid: primaryOwnerUid,
                ownerUids: allOwnerUids,
                name: branchName,
                tradeName: companyInfo.tradeName,
                slug: branchSlug,
                photo: companyInfo.photo || null,
                address,
                contactEmail: companyInfo.email || null,
                contactPhone: companyInfo.phone || null,
                companyInfo: { ...tenantData },
                owner: primaryOwnerData || {},
                status: "active",
                timezone: "America/Sao_Paulo",
                createdAt: timestamp,
                updatedAt: timestamp,
                isActive: true
            };

            transaction.set(branchRef, branchData);

            // Add all owners as staff
            for (const uid of allOwnerUids) {
                const staffRef = branchRef.collection("staff").doc(uid);
                const tenantStaffRef = tenantRef.collection("staff").doc(uid);

                let ownerInfo = {};
                if (uid === primaryOwnerUid && primaryOwnerData) {
                    ownerInfo = {
                        firstName: primaryOwnerData.firstName,
                        email: primaryOwnerData.email
                    };
                }

                const staffData = {
                    idStaff: uid,
                    role: 'owner',
                    ...ownerInfo,
                    createdAt: timestamp
                };

                // We don't have full data for existing owners here without extra reads. 
                // For simplicity, we just set the link. 
                // In a real app, you'd fetch user data first or rely on the user doc.
                transaction.set(staffRef, staffData, { merge: true });
                transaction.set(tenantStaffRef, staffData, { merge: true });
            }

            return { branchId: branchRef.id, tenantId: tenantRef.id };
        });

        logger.info(`Academy/Branch created: ${slug} (Tenant: ${result.tenantId})`);
        return { success: true, id: result.branchId, academiesId };

    } catch (error) {
        logger.error("Error creating academy branch:", error);
        throw new HttpsError(error.code || "internal", error.message);
    }
});

/**
 * Get all academies (Branches).
 */
exports.getAcademies = onCall(async (request) => {
    try {
        const snapshot = await db.collectionGroup("branches").get();
        const academies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return academies;
    } catch (error) {
        throw new HttpsError("internal", error.message);
    }
});

/**
 * Update an existing Academy/Branch.
 */
exports.updateAcademy = onCall(async (request) => {
    const { id, tenantId, ...updateData } = request.data;

    if (!id || !tenantId) {
        throw new HttpsError("invalid-argument", "Missing id or tenantId");
    }

    try {
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        const tenantRef = db.collection("tenants").doc(tenantId);
        const branchRef = tenantRef.collection("branches").doc(id);

        const newOwnersList = updateData.newOwners || [];
        const createdOwnerUids = [];

        // 1. Create/Find users for New Owners BEFORE transaction
        for (const ownerItem of newOwnersList) {
            if (!ownerItem.email) continue;
            const { uid } = await authService.findOrCreateUser({
                email: ownerItem.email,
                firstName: ownerItem.firstName,
                lastName: ownerItem.lastName,
                phone: ownerItem.phone,
                photo: null
            });
            await authService.setUserClaims(uid, { role: 'owner' });
            createdOwnerUids.push(uid);
        }

        const result = await db.runTransaction(async (transaction) => {
            const branchDoc = await transaction.get(branchRef);
            if (!branchDoc.exists) throw new HttpsError("not-found", "Branch not found");

            const branchData = branchDoc.data();
            let currentOwnerUids = updateData.owners || branchData.ownerUids || [];

            // Merge newly created UIDs from outer scope
            currentOwnerUids = [...new Set([...currentOwnerUids, ...createdOwnerUids])];

            // Prepare Branch Updates
            const branchUpdate = {
                updatedAt: timestamp
            };

            // Sync with staff collection
            const allStaffUids = [...new Set([...currentOwnerUids])];

            for (const uid of allStaffUids) {
                const staffRef = branchRef.collection("staff").doc(uid);
                const tenantStaffRef = tenantRef.collection("staff").doc(uid);

                // We just ensure they are in staff if added as owners
                transaction.set(staffRef, {
                    idStaff: uid,
                    role: 'owner',
                    updatedAt: timestamp
                }, { merge: true });

                transaction.set(tenantStaffRef, {
                    idStaff: uid,
                    role: 'owner',
                    updatedAt: timestamp
                }, { merge: true });
            }

            branchUpdate.ownerUids = currentOwnerUids;
            if (currentOwnerUids.length > 0 && !currentOwnerUids.includes(branchData.ownerUid)) {
                branchUpdate.ownerUid = currentOwnerUids[0];
            }

            if (updateData.tradeName) {
                branchUpdate.tradeName = updateData.tradeName;
                branchUpdate.name = updateData.name || updateData.tradeName;
            }
            if (updateData.address) branchUpdate.address = updateData.address;
            if (updateData.email) branchUpdate.contactEmail = updateData.email;
            if (updateData.phone) branchUpdate.contactPhone = updateData.phone;
            if (updateData.photo) branchUpdate.photo = updateData.photo;
            if (updateData.isActive !== undefined) branchUpdate.isActive = updateData.isActive;

            // Handle denormalized Company Info if provided
            if (updateData.companyInfo) {
                branchUpdate.companyInfo = {
                    ...branchData.companyInfo,
                    ...updateData.companyInfo,
                    updatedAt: timestamp
                };

                // Update the parent Tenant too
                transaction.update(tenantRef, {
                    ...updateData.companyInfo,
                    updatedAt: timestamp
                });
            }

            transaction.update(branchRef, branchUpdate);
            return { success: true };
        });

        logger.info(`Academy/Branch updated: ${id} (Tenant: ${tenantId})`);
        return result;

    } catch (error) {
        logger.error("Error updating academy branch:", error);
        throw new HttpsError(error.code || "internal", error.message);
    }
});

/**
 * Diagnostic function to list everything.
 */
exports.diagnosticList = onCall(async (request) => {
    try {
        const tenantsSnap = await db.collection("tenants").get();
        const result = [];

        for (const tenantDoc of tenantsSnap.docs) {
            const tenantData = tenantDoc.data();
            const branchesSnap = await tenantDoc.ref.collection("branches").get();

            const branches = branchesSnap.docs.map(doc => ({
                id: doc.id,
                path: doc.ref.path,
                ...doc.data()
            }));

            result.push({
                tenantId: tenantDoc.id,
                tenantName: tenantData.name || tenantData.tradeName,
                branches
            });
        }
        return result;
    } catch (error) {
        throw new HttpsError("internal", error.message);
    }
});
