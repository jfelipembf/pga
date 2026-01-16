// src/services/clientContracts/index.js

export {
  clientContractsCollection,
  clientContractRef,
  suspensionsCollection,
  suspensionRef,
  getClientContract,
} from "./clientContracts.repository"

export {
  listClientContracts,
  listClientContractsByClient,
  listContractSuspensions,
  createClientContract,
  scheduleContractSuspension,
  stopContractSuspension,
  cancelClientContract,
} from "./clientContracts.service"
