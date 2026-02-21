import { ActivityRules } from '../ActivityRules'

describe('ActivityRules', () => {

    // ========================================
    // validateForDeletion
    // ========================================
    describe('validateForDeletion', () => {
        it('deve permitir deletar atividade existente', () => {
            const activity = { id: 'act-1', name: 'Natação', deletedAt: null }
            expect(() => ActivityRules.validateForDeletion(activity)).not.toThrow()
        })

        it('deve impedir deletar atividade nula', () => {
            expect(() => ActivityRules.validateForDeletion(null))
                .toThrow(/não encontrada/)
        })

        it('deve impedir deletar atividade já excluída', () => {
            const activity = { id: 'act-1', deletedAt: '2024-01-01' }
            expect(() => ActivityRules.validateForDeletion(activity))
                .toThrow(/já foi excluída/)
        })
    })

    // ========================================
    // buildCreationPayload
    // ========================================
    describe('buildCreationPayload', () => {
        it('deve montar payload corretamente', () => {
            const data = { name: 'Natação Infantil', description: 'Turma 5-8 anos', photoFile: 'file-blob' }
            const payload = ActivityRules.buildCreationPayload(data, 'user-1', 'https://storage/photo.jpg')

            expect(payload.name).toBe('Natação Infantil')
            expect(payload.photo).toBe('https://storage/photo.jpg')
            expect(payload.photoUrl).toBe('https://storage/photo.jpg')
            expect(payload.isActive).toBe(true)
            expect(payload.status).toBe('active')
            expect(payload.createdBy).toBe('user-1')
            expect(payload.deletedAt).toBeNull()
            // photoFile deve ser removido do payload
            expect(payload.photoFile).toBeUndefined()
        })

        it('deve respeitar isActive=false', () => {
            const data = { name: 'Teste', isActive: false }
            const payload = ActivityRules.buildCreationPayload(data, 'u-1', null)
            expect(payload.isActive).toBe(false)
        })
    })

    // ========================================
    // buildUpdatePayload
    // ========================================
    describe('buildUpdatePayload', () => {
        it('deve montar payload de update removendo photoFile', () => {
            const data = { name: 'Atualizada', photoFile: 'blob-data' }
            const payload = ActivityRules.buildUpdatePayload(data, 'https://new-photo.jpg')

            expect(payload.name).toBe('Atualizada')
            expect(payload.photo).toBe('https://new-photo.jpg')
            expect(payload.photoFile).toBeUndefined()
        })
    })
})
