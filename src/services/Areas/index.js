import { AreaService } from '../Admin/AreaService'

export const listAreas = async (idTenant, idBranch) => {
    return await AreaService.listAreas(idTenant, idBranch)
}

export const saveArea = async (idTenant, idBranch, userId, areaData) => {
    return await AreaService.saveArea(idTenant, idBranch, userId, areaData)
}

export const deleteArea = async (idTenant, idBranch, userId, area) => {
    return await AreaService.deleteArea(idTenant, idBranch, userId, area)
}
