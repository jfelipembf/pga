const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../../shared/context");
const { sendWhatsAppMessageInternal } = require("../../notifications/whatsapp");
const { saveAuditLog } = require("../../shared/audit");

/**
 * Lógica para criar um usuário da equipe (Staff)
 */
async function createStaffUserLogic(data, context) {
    // Validação de contexto (Auth, Tenant, Branch)
    const { idTenant, idBranch } = requireAuthContext(data, context);

    const {
        email,
        password = "123456",
        firstName,
        lastName,
        role, // Nome do cargo (role)
        roleId, // ID do cargo (roleId)
        status = "active",
        phone,
        photo,
        avatar, // Legacy support
        isInstructor,
    } = data;

    // ... (validations omitted for brevity in targetContent, but I'll include them in ReplacementContent)

    // Validação de campos obrigatórios
    if (!email || !firstName) {
        const missing = [];
        if (!email) missing.push("email");
        if (!firstName) missing.push("firstName");

        console.error("Campos obrigatórios ausentes:", missing, "Data recebida:", data);

        throw new functions.https.HttpsError(
            "invalid-argument",
            `Campos obrigatórios ausentes: ${missing.join(", ")}.`
        );
    }

    const displayName = `${firstName} ${lastName || ""}`.trim();

    try {
        // 1. Sincronizar dados do Cargo (se roleId existir)
        let finalRole = role || null;
        let finalIsInstructor = !!isInstructor;

        if (roleId) {
            const roleRef = admin.firestore()
                .collection("tenants").doc(idTenant)
                .collection("branches").doc(idBranch)
                .collection("roles").doc(roleId);
            const roleSnap = await roleRef.get();
            if (roleSnap.exists) {
                const rData = roleSnap.data();
                finalRole = rData.label || finalRole;
                finalIsInstructor = rData.isInstructor !== undefined ? !!rData.isInstructor : finalIsInstructor;
            }
        }

        // 2. Verificar se usuário já existe no Auth
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
        } catch (error) {
            if (error.code !== "auth/user-not-found") {
                throw error;
            }
        }

        let uid;

        if (userRecord) {
            // Usuário já existe, reaproveitar UID
            uid = userRecord.uid;
        } else {
            // 3. Criar usuário no Auth
            userRecord = await admin.auth().createUser({
                email,
                password,
                displayName,
                disabled: status === "inactive",
            });
            uid = userRecord.uid;
        }

        // 4. Criar documento no Firestore (Staff)
        const staffRef = admin
            .firestore()
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("staff")
            .doc(uid);

        const now = FieldValue.serverTimestamp();

        await staffRef.set({
            id: uid,
            firstName,
            lastName,
            displayName,
            email,
            phone: phone || null,
            role: finalRole,
            roleId: roleId || null,
            status,
            photo: photo || avatar || null,
            avatar: photo || avatar || null,
            isInstructor: finalIsInstructor,
            isFirstAccess: true, // Força a troca de senha no primeiro login

            // Dados Pessoais
            gender: data.gender || null,
            birthDate: data.birthDate || null,

            // Endereço (Normalizado apenas no mapa 'address')
            address: data.address || null,

            // Dados Profissionais
            hireDate: data.hireDate || null,
            council: data.council || null,
            employmentType: data.employmentType || null,
            salary: data.salary ? Number(data.salary) : null,
            idTenant,
            idBranch,
            createdAt: now,
            updatedAt: now,
        });

        // Tentar enviar mensagem de boas-vindas
        // await sendWelcomeMessage(idTenant, idBranch, {
        //     id: uid,
        //     firstName,
        //     email,
        //     phone
        // });

        // Registrar Log de Auditoria
        await saveAuditLog({
            idTenant,
            idBranch,
            uid: context.auth.uid,
            action: "STAFF_CREATE",
            targetId: uid,
            description: `Criou o colaborador ${displayName} (${finalRole})`,
            metadata: { email, role: finalRole, roleId }
        });

        return {
            success: true,
            uid,
            message: "Colaborador criado com sucesso.",
        };
    } catch (error) {
        console.error("Erro ao criar colaborador:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Erro interno ao criar colaborador.", error);
    }
}

// Helper para enviar mensagem de boas-vindas (Executado após criação)
async function sendWelcomeMessage(idTenant, idBranch, staffData) {

    try {
        if (!staffData.phone) {

            return;
        }

        // Buscar Tenant e Branch para pegar Slugs

        const tenantSnap = await admin.firestore().collection("tenants").doc(idTenant).get();
        const branchSnap = await admin.firestore().collection("tenants").doc(idTenant).collection("branches").doc(idBranch).get();

        if (!tenantSnap.exists || !branchSnap.exists) {
            console.error("[WelcomeMessage] Erro: Tenant ou Branch não encontrados.");
            return;
        }

        const tenantData = tenantSnap.data();
        const branchData = branchSnap.data();

        const tenantSlug = tenantData.slug || idTenant;
        const branchSlug = branchData.slug || idBranch;

        const url = `https://app.painelswim.com/${tenantSlug}/${branchSlug}/`;


        const message = `Olá ${staffData.firstName}, seja bem vindo, ao painel swim para seu acesso use a URL abaixo. criamos uma senha provisoria para voce

email de acesso: ${staffData.email}
senha provisoria: 123456

${url}

altera a sua senha por seguranca apos o primeiro acesso e tenha um otimo dia de trabalho`;


        await sendWhatsAppMessageInternal(idTenant, idBranch, staffData.phone, message);


    } catch (err) {
        console.error("[WelcomeMessage] Erro CATASTRÓFICO:", err);
    }
}


/**
 * Lógica para atualizar um usuário da equipe (Staff)
 */
async function updateStaffUserLogic(data, context) {
    console.log("[updateStaffUserLogic] Iniciando atualização. Data:", JSON.stringify(data));

    // Validação de contexto (Auth, Tenant, Branch)
    const { idTenant, idBranch } = requireAuthContext(data, context);
    console.log("[updateStaffUserLogic] Contexto validado:", { idTenant, idBranch });

    const {
        id, // UID do usuário a ser atualizado
        email,
        password,
        firstName,
        lastName,
        role,
        roleId,
        status,
        phone,
        photo,
        avatar, // Legacy support handling
        isInstructor,
        address
    } = data;

    if (!id) {
        console.error("[updateStaffUserLogic] ID ausente.");
        throw new functions.https.HttpsError(
            "invalid-argument",
            "O ID do colaborador é obrigatório para atualização."
        );
    }

    const now = FieldValue.serverTimestamp();

    try {
        const staffRef = admin
            .firestore()
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("staff")
            .doc(id);

        console.log("[updateStaffUserLogic] Buscando doc Firestore:", staffRef.path);
        const staffSnap = await staffRef.get();
        if (!staffSnap.exists) {
            console.error("[updateStaffUserLogic] Doc não encontrado.");
            throw new functions.https.HttpsError('not-found', 'Colaborador não encontrado para atualização.');
        }
        const currentData = staffSnap.data();

        // 1. Garantir Integridade do Nome (DisplayName)
        // Se um dos nomes não for enviado, usar o atual do banco para evitar "undefined"
        const finalFirstName = firstName !== undefined ? firstName : (currentData.firstName || "");
        const finalLastName = lastName !== undefined ? lastName : (currentData.lastName || "");
        const displayName = `${finalFirstName} ${finalLastName}`.trim();

        // 2. Normalizar Foto (Prioridade: photo > avatar > banco)
        // Evita "fallback" confuso e duplicação desnecessária mantendo coerência
        let finalPhoto = null;
        if (photo !== undefined) finalPhoto = photo;
        else if (avatar !== undefined) finalPhoto = avatar;
        else finalPhoto = currentData.photo || currentData.avatar || null;

        // 3. Sincronizar dados do Cargo
        let finalRole = role !== undefined ? role : currentData.role || null;
        let finalIsInstructor = isInstructor !== undefined ? !!isInstructor : (currentData.isInstructor || false);

        if (roleId && roleId !== currentData.roleId) {
            const roleRef = admin.firestore()
                .collection("tenants").doc(idTenant)
                .collection("branches").doc(idBranch)
                .collection("roles").doc(roleId);
            const roleSnap = await roleRef.get();
            if (roleSnap.exists) {
                const rData = roleSnap.data();
                finalRole = rData.label || finalRole;
                finalIsInstructor = rData.isInstructor !== undefined ? !!rData.isInstructor : finalIsInstructor;
            }
        }

        // 4. Atualizar Authentication (apenas se houver mudanças relevantes)
        const authUpdates = {};
        if (email && email !== currentData.email) authUpdates.email = email;
        if (password && password.length >= 6) authUpdates.password = password;
        if (displayName && displayName !== currentData.displayName) authUpdates.displayName = displayName;
        if (status && (status === "inactive") !== currentData.disabled) authUpdates.disabled = status === "inactive";
        if (finalPhoto && finalPhoto !== currentData.photo) authUpdates.photoURL = finalPhoto;

        if (Object.keys(authUpdates).length > 0) {
            console.log("[updateStaffUserLogic] Atualizando Auth:", authUpdates);
            try {
                await admin.auth().updateUser(id, authUpdates);
                console.log("[updateStaffUserLogic] Auth atualizado com sucesso.");
            } catch (authError) {
                console.error("Erro ao atualizar Auth:", authError);
                if (authError.code === 'auth/user-not-found') {
                    throw new functions.https.HttpsError('not-found', 'Usuário não encontrado no sistema de autenticação (Auth).');
                }
                if (authError.code === 'auth/email-already-exists') {
                    throw new functions.https.HttpsError('already-exists', 'O email fornecido já está em uso por outro usuário.');
                }
                if (authError.code === 'auth/invalid-password') {
                    throw new functions.https.HttpsError('invalid-argument', 'A senha deve ter pelo menos 6 caracteres.');
                }
                throw authError;
            }
        }

        // 5. Preparar Payload do Firestore (Sem undefined)
        const firestorePayload = {
            firstName: finalFirstName,
            lastName: finalLastName,
            displayName, // Agora sempre correto
            email: email !== undefined ? email : currentData.email,
            phone: phone !== undefined ? phone : (currentData.phone || null),
            role: finalRole,
            roleId: roleId !== undefined ? roleId : (currentData.roleId || null),
            status: status !== undefined ? status : (currentData.status || "active"),
            photo: finalPhoto,
            avatar: finalPhoto, // Mantém sincronizado para legado, mas com valor idêntico
            isInstructor: finalIsInstructor,
            address: address !== undefined ? address : (currentData.address || null),
            updatedAt: now,
        };

        // Remove campos undefined para não gravar lixo (safety check)
        Object.keys(firestorePayload).forEach(key => firestorePayload[key] === undefined && delete firestorePayload[key]);

        // Campos legados para remover
        const fieldsToRemove = {
            zip: FieldValue.delete(),
            state: FieldValue.delete(),
            city: FieldValue.delete(),
            neighborhood: FieldValue.delete(),
            number: FieldValue.delete(),
            complement: FieldValue.delete()
        };

        console.log("[updateStaffUserLogic] Salvando no Firestore:", firestorePayload);
        await staffRef.set({ ...firestorePayload, ...fieldsToRemove }, { merge: true });
        console.log("[updateStaffUserLogic] Sucesso ao salvar Firestore.");

        // Registrar Log de Auditoria
        await saveAuditLog({
            idTenant,
            idBranch,
            uid: context.auth.uid,
            action: "STAFF_UPDATE",
            targetId: id,
            description: `Atualizou os dados do colaborador ${displayName}`,
            metadata: {
                updates: Object.keys(firestorePayload),
                email: firestorePayload.email
            }
        });

        return {
            success: true,
            message: "Colaborador atualizado com sucesso.",
        };
    } catch (error) {
        console.error("[updateStaffUserLogic] ERRO FATAL:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Erro interno ao atualizar colaborador.", error);
    }
}

module.exports = {
    createStaffUserLogic,
    updateStaffUserLogic,
    sendWelcomeMessage
};
