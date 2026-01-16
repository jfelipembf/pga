const admin = require("firebase-admin");
const db = admin.firestore();

const TYPE_PREFIX_MAP = {
  sale: "SALE",
  sales: "SALE",
  transaction: "TX",
  cashier: "TX",
  product: "PROD",
  service: "SERV",
  contract: "CONT",
  enrollment: "ENRL",
  receivable: "RCV",
  client: "CLNT",
  generic: "GEN",
};


const SALE_SUBTYPE_MAP = {
  contract: "CONT",
  service: "SERV",
  product: "PROD",
  enrollment: "ENRL",
  generic: "SALE",
};

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const randomSegment = (length) => {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return out;
};

/**
 * Incrementa um contador sequencial por tipo e ano no Firestore (Backend).
 * @param {string} idTenant - ID do tenant
 * @param {string} idBranch - ID da branch
 * @param {string} typeKey - Tipo do contador
 * @param {string} year - Ano do contador
 * @return {Promise<number>} - Próximo número sequencial
 */
const getNextSequentialNumber = async (idTenant, idBranch, typeKey, year) => {
  if (!idTenant || !idBranch) return 1;

  const counterRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("counters")
    .doc(`${typeKey}-${year}`);

  try {
    const next = await db.runTransaction(async (t) => {
      const snap = await t.get(counterRef);
      const current = snap.exists ? Number(snap.data().value || 0) : 0;
      const value = current + 1;
      t.set(counterRef, { value }, { merge: true });
      return value;
    });
    return next;
  } catch (error) {
    console.error("Erro ao gerar ID sequencial:", error);
    // fallback: timestamp modificado
    return Date.now() % 100000;
  }
};

/**
 * Gera um ID de entidade (Backend).
 * @param {string} idTenant - ID do tenant
 * @param {string} idBranch - ID da branch
 * @param {string} entityType - Tipo da entidade
 * @param {Object} options - Opções adicionais
 * @return {Promise<string>} - ID gerado
 */
exports.generateEntityId = async (
  idTenant,
  idBranch,
  entityType = "generic",
  options = {},
) => {
  const { prefix, subtype, date = new Date(), sequential = false, digits = 3 } = options;

  let basePrefix;
  if (entityType === "sale" && subtype && SALE_SUBTYPE_MAP[subtype]) {
    basePrefix = SALE_SUBTYPE_MAP[subtype];
  } else {
    basePrefix = (prefix || TYPE_PREFIX_MAP[entityType] || TYPE_PREFIX_MAP.generic).toUpperCase();
  }

  const d = date instanceof Date ? date : new Date(date || Date.now());
  const year = d.getFullYear();

  if (sequential) {
    const counterKey = subtype ? `${entityType}-${subtype}` : entityType;
    const next = await getNextSequentialNumber(idTenant, idBranch, counterKey, String(year));
    const padded = String(next).padStart(digits, "0");
    return `${basePrefix}-${year}-${padded}`;
  }

  // fallback format
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const short = randomSegment(2);
  return `${basePrefix}-${year}-${month}-${day}-${short}`;
};
