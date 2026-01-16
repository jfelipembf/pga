import React, { useEffect, useMemo } from "react"
import { Row, Col } from "reactstrap"
import { connect } from "react-redux"

import BasicTable from "../../common/BasicTable"
import UserModal from "./components/UserModal"
import PageLoader from "../../components/Common/PageLoader"
import { setBreadcrumbItems } from "../../store/actions"

import useUsers from "./hooks/useUsers"
import { useUserActions } from "./hooks/useUserActions"
import { useUserTableColumns } from "./hooks/useUserTableColumns"
import { formatUserForTable } from "./utils/userUtils"

const Users = ({ setBreadcrumbItems }) => {
    const { users, loading, addUser, updateUser, removeUser } = useUsers()

    const {
        modalOpen,
        selectedUser,
        handleCreate,
        handleEdit,
        handleDelete,
        handleSave,
        toggleModal,
        saveLoading
    } = useUserActions({ addUser, updateUser, removeUser })

    const columns = useUserTableColumns({ onEdit: handleEdit, onDelete: handleDelete })

    const formattedUsers = useMemo(() => users.map(formatUserForTable), [users])

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Colaboradores", link: "#" },
            { title: "Lista", link: "#" },
        ]
        setBreadcrumbItems("Usuários", breadcrumbItems)
    }, [setBreadcrumbItems])

    return (
        <Row>
            <Col>
                {loading && !users.length ? (
                    <PageLoader />
                ) : (
                    <>
                        <BasicTable
                            columns={columns}
                            data={formattedUsers}
                            searchKeys={["firstName", "lastName", "email", "phone"]}
                            searchPlaceholder="Buscar colaboradores..."
                            onNewClick={handleCreate}
                        />
                        <UserModal
                            isOpen={modalOpen}
                            toggle={toggleModal}
                            user={selectedUser}
                            onSave={handleSave}
                            submitting={saveLoading}
                        />
                    </>
                )}
            </Col>
        </Row>
    )
}

export default connect(null, { setBreadcrumbItems })(Users)
