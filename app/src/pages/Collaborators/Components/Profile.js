import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap"
import { useSearchParams } from "react-router-dom"

import CollaboratorProfileForm from "./CollaboratorProfileForm"
import CollaboratorClasses from "./CollaboratorClasses"
import { setBreadcrumbItems } from "../../../store/actions"
import directoryBg from "../../../assets/images/directory-bg.jpg"
import PageLoader from "../../../components/Common/PageLoader"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import { useLoading } from "../../../hooks/useLoading"
import { useToast } from "components/Common/ToastProvider"

import { TABS } from "../Constants/index"
import { MOCK_CLASSES as mockClasses } from "../Constants/collaboratorDefaults"
import { listRoles } from "../../../services/Roles/roles.service"
import { getStaff, updateStaff, useStaffPhotoUpload } from "../../../services/Staff/index"
import { PLACEHOLDER_AVATAR } from "../../Clients/Constants/defaults"
import { buildStaffPayload } from "../../../services/payloads"

const CollaboratorProfile = ({ setBreadcrumbItems }) => {
  const [searchParams] = useSearchParams()
  const staffId = searchParams.get("id")

  const [activeTab, setActiveTab] = useState("Perfil")
  const [formData, setFormData] = useState(null)
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  })
  const { isLoading, withLoading } = useLoading()
  const [roles, setRoles] = useState([])
  const toast = useToast()
  const { uploadPhoto, uploading } = useStaffPhotoUpload()

  useEffect(() => {
    const breadcrumbs = [
      { title: "Colaboradores", link: "/collaborators/list" },
      { title: "Perfil", link: "/collaborators/profile" },
    ]
    setBreadcrumbItems("Perfil do colaborador", breadcrumbs)
  }, [setBreadcrumbItems])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await listRoles()
        setRoles(data)
      } catch (error) {
        console.error("Erro ao carregar funções:", error)
      }
    }
    fetchRoles()
  }, [])

  useEffect(() => {
    if (!staffId) return

    const loadStaff = async () => {
      try {
        await withLoading('page', async () => {
          const data = await getStaff(staffId)
          if (data) {
            setFormData({
              ...data,
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              email: data.email || "",
              phone: data.phone || "",
              role: data.role || "",
              status: data.status || "active",
              avatar: data.avatar || null,
              isInstructor: !!data.isInstructor
            })
          }
        })
      } catch (error) {
        console.error("Erro ao carregar colaborador:", error)
        toast.show({ title: "Erro", description: "Não foi possível carregar os dados.", color: "danger" })
      }
    }
    loadStaff()
  }, [staffId, toast, withLoading])

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updatePasswordField = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData) return
    try {
      await withLoading('save', async () => {
        let photoUrl = formData.photo
        if (formData.avatarFile) {
          photoUrl = await uploadPhoto(formData.avatarFile)
        }

        const rawPayload = { ...formData, photo: photoUrl }
        // Remove legacy fields if they exist before builder (optional, builder handles it)
        delete rawPayload.avatarFile
        delete rawPayload.avatar // Strict cleanup

        const payload = buildStaffPayload(rawPayload)
        payload.id = staffId // Ensure ID is present from URL param

        await updateStaff(payload)
        setFormData(payload)
        toast.show({ title: "Sucesso", description: "Dados atualizados com sucesso.", color: "success" })
      })
    } catch (e) {
      console.error('Erro ao salvar colaborador', e)
      toast.show({ title: "Erro", description: "Falha ao salvar dados.", color: "danger" })
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordForm.next || passwordForm.next !== passwordForm.confirm) {
      toast.show({ title: "Erro", description: "As senhas não conferem.", color: "warning" })
      return
    }
    // Note: 'current' password check requires re-auth user, which Admin SDK can't do easily without custom flow.
    // However, Admin SDK allows admin to OVERRIDE password. We will proceed with override.

    try {
      await withLoading('password', async () => {
        await updateStaff({ id: staffId, password: passwordForm.next })
        setPasswordForm({ current: "", next: "", confirm: "" })
        toast.show({ title: "Sucesso", description: "Senha alterada com sucesso.", color: "success" })
      })
    } catch (e) {
      console.error('Erro ao alterar senha', e)
      toast.show({ title: "Erro", description: "Falha ao alterar senha.", color: "danger" })
    }
  }

  if (isLoading('page') || !formData) {
    return <PageLoader />
  }

  const profile = {
    name: `${formData.firstName} ${formData.lastName}`,
    id: formData.id || "N/A",
    status: formData.status === "active" ? "Ativo" : "Inativo",
    statusColor: formData.status === "active" ? "success" : "secondary",
    photo: formData.photo || PLACEHOLDER_AVATAR,
    cover: directoryBg,
  }

  return (
    <Container fluid className="client-profile collaborator-profile">
      <div
        className="client-profile__hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%), url(${profile.cover})`,
        }}
      >
        <div className="client-profile__content">
          <div className="d-flex align-items-center gap-3">
            <div className="client-profile__avatar-wrapper">
              <div
                className="client-profile__avatar"
                style={{ backgroundImage: `url("${profile.photo}")` }}
              >
              </div>
              <label htmlFor="collabAvatar" className="client-profile__camera">
                <i className="mdi mdi-camera" />
              </label>
              <input
                type="file"
                id="collabAvatar"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  // Set preview
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    updateField("photo", reader.result) // Preview
                    updateField("avatarFile", file) // File to upload
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </div>
            <div className="text-white">
              <h3 className="mb-1 text-truncate">{profile.name}</h3>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* <span className="fw-semibold">ID: {profile.id}</span> */}
                <Badge color={profile.statusColor} pill className="px-3 py-2">
                  {profile.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <Button color="light" className="d-flex align-items-center gap-2" href={`mailto:${formData.email}`}>
              <i className="mdi mdi-email-outline" />
              Contatar
            </Button>
            <ButtonLoader color="primary" className="d-flex align-items-center gap-2" onClick={handleSave} loading={isLoading('save') || uploading}>
              <i className="mdi mdi-content-save" />
              Salvar
            </ButtonLoader>
          </div>
        </div>

        <div className="client-profile__tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              className={`client-profile__tab ${activeTab === tab ? "client-profile__tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <Row className="g-4 mt-3">
        {activeTab === "Perfil" && (
          <Col md="12">
            <Card className="shadow-sm">
              <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h5 className="mb-0">Dados do colaborador</h5>
                  <p className="text-muted mb-0 small">Informações de contato e acesso.</p>
                </div>
              </CardHeader>
              <CardBody>
                <CollaboratorProfileForm
                  value={formData}
                  onChange={updateField}
                  passwordValue={passwordForm}
                  onPasswordChange={updatePasswordField}
                  onSave={(action) => action === 'password' ? handlePasswordChange() : handleSave()}
                  saving={isLoading('save') || uploading}
                  savingPassword={isLoading('password')}
                  roles={roles}
                />
              </CardBody>
            </Card>
          </Col>
        )}

        {activeTab === "Minhas turmas" && (
          <Col md="12">
            <CollaboratorClasses classes={mockClasses} />
          </Col>
        )}
      </Row>
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(CollaboratorProfile)
