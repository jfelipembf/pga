/**
 * Helper para sanitização e preparação de dados de Clientes.
 * Centraliza a lógica de formatação para evitar duplicação nos serviços.
 */
export const ClientHelper = {
    /**
     * Sanitiza valores nulos ou indefinidos.
     */
    sanitize: (val) => (val === undefined || val === '') ? null : val,

    /**
     * Prepara o objeto do cliente para persistência.
     * Unifica lógica de endereço, contatos e busca.
     */
    prepareForSave: (rawData) => {
        const sanitize = ClientHelper.sanitize;

        const firstName = sanitize(rawData.firstName);
        const lastName = sanitize(rawData.lastName);
        const name = rawData.name || `${firstName || ''} ${lastName || ''}`.trim();

        const prepared = {
            ...rawData,
            firstName,
            lastName,
            name,
            photoUrl: rawData.photoUrl || null,
            cpf: sanitize(rawData.cpf),
            gender: sanitize(rawData.gender) || 'unspecified',
            birthDate: rawData.birthDate || null,

            // Estrutura de Endereço
            address: rawData.address || {
                zipCode: sanitize(rawData.zipCode),
                street: sanitize(rawData.street),
                number: sanitize(rawData.number),
                complement: sanitize(rawData.complement),
                neighborhood: sanitize(rawData.neighborhood),
                city: sanitize(rawData.city),
                state: sanitize(rawData.state)
            },

            // Estrutura de Contato de Emergência
            emergencyContact: rawData.emergencyContact || {
                name: sanitize(rawData.emergencyName),
                phone: sanitize(rawData.emergencyPhone),
                email: sanitize(rawData.emergencyEmail)
            },

            healthObservations: sanitize(rawData.healthObservations) || null
        };

        return prepared;
    },

    /**
     * Gera uma string consolidada para busca (Data-driven Search).
     */
    generateSearchText: (client) => {
        const parts = [
            client.name,
            client.cpf,
            client.email,
            client.phone,
            client.mobile,
            client.friendlyId ? String(client.friendlyId) : ''
        ].filter(Boolean).map(s => String(s).toLowerCase().trim());

        return parts.join(' ');
    }
};
