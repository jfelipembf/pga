const functions = require("firebase-functions/v1");
const { generateEntityId } = require("../shared/id");

/**
 * Trigger: Gera idGym sequencial quando um cliente é criado sem ID.
 * Executa em background, não bloqueia a resposta ao usuário.
 */
exports.onClientCreate = functions.firestore
    .document("tenants/{idTenant}/branches/{idBranch}/clients/{idClient}")
    .onCreate(async (snap, context) => {
        const data = snap.data();

        // Só processa se idGym estiver pendente
        if (!data.idGymPending || data.idGym) {
            return null;
        }

        const { idTenant, idBranch } = context.params;

        try {
            // Gera ID sequencial (não bloqueia o usuário)
            const fullId = await generateEntityId(idTenant, idBranch, "client", {
                prefix: "",
                sequential: true,
                digits: 4
            });
            const idGym = fullId.split('-').pop();

            // Atualiza documento
            await snap.ref.update({
                idGym,
                idGymPending: false,
                updatedAt: new Date().toISOString()
            });

            return null;
        } catch (error) {
            console.error(`[onClientCreate] Error generating idGym for client ${snap.id}:`, error);

            // Marca como erro para retry manual
            await snap.ref.update({
                idGymPending: false,
                idGymError: error.message
            }).catch(console.error);

            return null;
        }
    });
