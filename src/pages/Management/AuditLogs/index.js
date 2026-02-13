import React, { useState } from "react";
import BasicTable from "../../../components/Common/BasicTable";
import AuditLogDetailsModal from "./components/AuditLogDetailsModal";
import AuditFilters from "./components/AuditFilters";
import PageLoader from "../../../components/Common/PageLoader";
import { useTenant } from "../../../hooks/useTenant";

// Hooks
import { useAuditLogs } from "./hooks/useAuditLogs";
import { useAuditTableColumns } from "./hooks/useAuditTableColumns";

/**
 * AuditLogsPage - Componente principal da trilha de auditoria.
 * Centraliza a visualização de ações críticas e histórico do sistema.
 */
const AuditLogsPage = () => {
    document.title = "Logs de Auditoria | PGA Admin";
    const { isReady } = useTenant();

    // Data Hook Providers
    const {
        logs,
        loading,
        staff,
        filters,
        setFilters
    } = useAuditLogs();

    // UI States
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Handlers
    const toggleModal = () => setModalOpen(!modalOpen);
    const toggleFilters = () => setIsFiltersOpen(!isFiltersOpen);

    const viewDetails = (log) => {
        setSelectedLog(log);
        setModalOpen(true);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    // Columns Configuration
    const columns = useAuditTableColumns({
        staff,
        onViewDetails: viewDetails
    });

    const isInitialLoading = !isReady || (loading && logs.length === 0);

    return (
        <React.Fragment>
            {isInitialLoading ? (
                <PageLoader isFullScreen={true} />
            ) : (
                <>
                    {/* Seção de Filtros */}
                    <AuditFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        isFiltersOpen={isFiltersOpen}
                        toggleFilters={toggleFilters}
                    />

                    {/* Tabela de Resultados */}
                    <BasicTable
                        columns={columns}
                        data={logs}
                        loading={loading}
                        isSearchable={true}
                        hideSearch={true}
                        externalSearch={searchTerm}
                        onExternalSearchChange={setSearchTerm}
                        wrapWithCard={true}
                        pagination={{
                            enabled: true,
                            pageSize: 15
                        }}
                    />
                </>
            )}

            {/* Detalhes do Log */}
            <AuditLogDetailsModal
                isOpen={modalOpen}
                toggle={toggleModal}
                log={selectedLog}
                userName={selectedLog ? (staff[selectedLog.userId]?.name || selectedLog.userName || selectedLog.userId || 'Usuário Desconhecido') : ''}
            />
        </React.Fragment>
    );
};

export default AuditLogsPage;
