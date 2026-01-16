import React, { useState } from "react"
import { useDispatch } from "react-redux"
import { Row, Col } from "reactstrap"
import { useNavigate } from "react-router-dom"
import { setBreadcrumbItems } from "../../store/actions"
import useAcademies from "./hooks/useAcademies"
import AcademyModal from "./components/AcademyModal"
import AcademyList from "./components/AcademyList"
import PageLoader from "../../components/Common/PageLoader"
import { uploadImage } from "../../helpers/storage_helper"

const Academies = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { academies, loading, createAcademy, checkSlugAvailability } = useAcademies()

    const [modalOpen, setModalOpen] = useState(false)
    const [selectedAcademy, setSelectedAcademy] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    // Set Breadcrumbs
    React.useEffect(() => {
        dispatch(setBreadcrumbItems("Academias", [{ title: "Dashboard", link: "/" }, { title: "Academias", link: "#" }]))
    }, [dispatch])

    const toggleModal = () => {
        setModalOpen(!modalOpen)
        if (modalOpen) setSelectedAcademy(null)
    }

    const handleCreate = () => {
        setSelectedAcademy(null)
        setModalOpen(true)
    }

    const handleView = (academy) => {
        navigate(`/academies/${academy.id}`)
    }

    const handleSave = async (data) => {
        setSubmitting(true)
        try {
            let photoUrl = data.companyInfo.photo // Could be file or null

            // 1. Upload Photo if it's a File
            if (photoUrl instanceof File) {

                const path = `academies/${Date.now()}_${photoUrl.name}`
                photoUrl = await uploadImage(photoUrl, path)

            }

            // Helper to format phone to E.164
            const formatToE164 = (phone) => {
                if (!phone) return "";
                const digits = phone.replace(/\D/g, "");
                return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
            };

            // 2. Prepare Payload with formatted phones
            const payload = {
                ...data,
                companyInfo: {
                    ...data.companyInfo,
                    photo: photoUrl,
                    phone: formatToE164(data.companyInfo.phone)
                },
                owner: {
                    ...data.owner,
                    phone: formatToE164(data.owner.phone)
                }
            }

            // 3. Create or Update
            if (selectedAcademy) {
                // await updateAcademy(selectedAcademy.id, payload)

            } else {
                await createAcademy(payload)
            }

            setModalOpen(false)
        } catch (error) {
            console.error("Failed to save academy", error);
            // Toast handled in hook
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <PageLoader />
    }

    return (
        <React.Fragment>
            <Row>
                <Col>
                    <AcademyList
                        academies={academies}
                        onView={handleView}
                        onNewClick={handleCreate}
                    />

                    <AcademyModal
                        isOpen={modalOpen}
                        toggle={toggleModal}
                        user={selectedAcademy}
                        onSave={handleSave}
                        submitting={submitting}
                        onCheckSlug={checkSlugAvailability}
                    />
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default Academies
