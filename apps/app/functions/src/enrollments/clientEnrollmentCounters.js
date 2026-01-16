const functions = require("firebase-functions/v1");
const { isActive, applyDelta } = require("./helpers/counterHelper");

/**
 * ============================================================================
 * CLIENT ENROLLMENT COUNTERS TRIGGERS
 * ____________________________________________________________________________
 *
 * 1. onCreate: Incrementa contadores ao criar matrícula.
 * 2. onDelete: Decrementa contadores ao remover matrícula.
 * 3. onUpdate: Atualiza contadores ao mudar status da matrícula.
 *
 * ============================================================================
 */

const handleCreate = async ({ idTenant, idBranch, enrollment }) => {
  const idClient = enrollment?.idClient ? String(enrollment.idClient) : null;
  const active = isActive(enrollment?.status);
  await applyDelta({
    idTenant,
    idBranch,
    idClient,
    activeDelta: active ? 1 : 0,
    pastDelta: active ? 0 : 1,
  });
};

const handleDelete = async ({ idTenant, idBranch, enrollment }) => {
  const idClient = enrollment?.idClient ? String(enrollment.idClient) : null;
  const active = isActive(enrollment?.status);
  await applyDelta({
    idTenant,
    idBranch,
    idClient,
    activeDelta: active ? -1 : 0,
    pastDelta: active ? 0 : -1,
  });
};

const handleUpdate = async ({ idTenant, idBranch, before, after }) => {
  const beforeClient = before?.idClient ? String(before.idClient) : null;
  const afterClient = after?.idClient ? String(after.idClient) : null;

  const beforeActive = isActive(before?.status);
  const afterActive = isActive(after?.status);

  if (!beforeClient || !afterClient) return;

  if (beforeClient !== afterClient) {
    await applyDelta({
      idTenant,
      idBranch,
      idClient: beforeClient,
      activeDelta: beforeActive ? -1 : 0,
      pastDelta: beforeActive ? 0 : -1,
    });

    await applyDelta({
      idTenant,
      idBranch,
      idClient: afterClient,
      activeDelta: afterActive ? 1 : 0,
      pastDelta: afterActive ? 0 : 1,
    });

    return;
  }

  if (beforeActive === afterActive) return;

  await applyDelta({
    idTenant,
    idBranch,
    idClient: afterClient,
    activeDelta: afterActive ? 1 : -1,
    pastDelta: afterActive ? -1 : 1,
  });
};

exports.onCreate = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onCreate(async (snap, context) => {
    const enrollment = snap.data() || {};
    await handleCreate({
      idTenant: context?.params?.idTenant,
      idBranch: context?.params?.idBranch,
      enrollment,
    });
    return null;
  });

exports.onDelete = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onDelete(async (snap, context) => {
    const enrollment = snap.data() || {};
    await handleDelete({
      idTenant: context?.params?.idTenant,
      idBranch: context?.params?.idBranch,
      enrollment,
    });
    return null;
  });

exports.onUpdate = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

    await handleUpdate({
      idTenant: context?.params?.idTenant,
      idBranch: context?.params?.idBranch,
      before,
      after,
    });

    return null;
  });
