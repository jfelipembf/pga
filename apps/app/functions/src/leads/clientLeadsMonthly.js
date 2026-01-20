const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const db = admin.firestore();

module.exports = functions
  .region("us-central1")
  .firestore
  .document(
    "tenants/{idTenant}/branches/{idBranch}/clients/{idClient}",
  )
  .onCreate(async (snap, context) => {
    const idTenant = context?.params?.idTenant;
    const idBranch = context?.params?.idBranch;

    if (!idTenant || !idBranch) return null;

    const client = snap.data() || {};
    if (String(client.status || "").toLowerCase() !== "lead") {
      return null;
    }

    const monthId = new Date().toISOString().slice(0, 7);

    const monthlyRef = db
      .collection("tenants")
      .doc(String(idTenant))
      .collection("branches")
      .doc(String(idBranch))
      .collection("monthlySummary")
      .doc(monthId);

    await monthlyRef.set(
      {
        idTenant: String(idTenant),
        idBranch: String(idBranch),
        id: monthId,
        leadsMonth: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return null;
  });
