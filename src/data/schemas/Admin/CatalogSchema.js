import * as yup from 'yup'

/**
 * Schema de validação para Catálogo de Produtos/Serviços (Catalog)
 */
export const CatalogSchema = yup.object().shape({
    name: yup.string().required('Nome do item é obrigatório'),
    description: yup.string().nullable(),
    type: yup.string().oneOf(['product', 'service']).required('Tipo é obrigatório'),
    price: yup.number().positive('Preço deve ser positivo').required('Preço é obrigatório'),
    cost: yup.number().positive('Custo deve ser positivo').nullable(),
    sku: yup.string().nullable(),
    barcode: yup.string().nullable(),
    category: yup.string().nullable(),
    stock: yup.number().default(0),
    minStock: yup.number().default(0),
    isActive: yup.boolean().default(true),
    status: yup.string().oneOf(['active', 'inactive', 'deleted']).default('active'),
    metadata: yup.object().nullable()
})
