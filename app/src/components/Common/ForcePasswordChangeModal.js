import React, { useState } from "react"
import { Modal, ModalHeader, ModalBody, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap"
import { getAuth, updatePassword } from "firebase/auth"
import { doc, updateDoc, getFirestore } from "firebase/firestore"

const ForcePasswordChangeModal = ({ isOpen }) => {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Pegar dados do usuário e contexto do localStorage
    const getUserData = () => {
        try {
            const authUser = JSON.parse(localStorage.getItem("authUser"))
            const idTenant = localStorage.getItem("idTenant")
            const idBranch = localStorage.getItem("idBranch")
            return { ...authUser, idTenant, idBranch }
        } catch (e) {
            return null
        }
    }

    const userData = getUserData()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccess(false)

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.")
            return
        }

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.")
            return
        }

        setLoading(true)

        try {
            const auth = getAuth()
            const currentUser = auth.currentUser

            if (!currentUser) {
                throw new Error("Usuário não autenticado.")
            }

            // 1. Atualizar Senha no Auth
            await updatePassword(currentUser, password)

            // 2. Atualizar flag no Firestore
            // Caminho: tenants/{idTenant}/branches/{idBranch}/staff/{uid}
            if (userData && userData.idTenant && userData.idBranch) {
                const db = getFirestore()
                const staffRef = doc(db, "tenants", userData.idTenant, "branches", userData.idBranch, "staff", currentUser.uid)

                await updateDoc(staffRef, {
                    isFirstAccess: false,
                    updatedAt: new Date()
                })

                // 3. Atualizar LocalStorage para refletir a mudança imediatamente
                try {
                    const authUser = JSON.parse(localStorage.getItem("authUser"))
                    if (authUser && authUser.staff) {
                        authUser.staff.isFirstAccess = false
                        localStorage.setItem("authUser", JSON.stringify(authUser))
                    }
                } catch (e) {
                    console.error("Erro ao atualizar localStorage:", e)
                }

                setSuccess(true)

                // Pequeno delay para usuário ler a mensagem antes de recarregar/fechar
                setTimeout(() => {
                    window.location.reload() // Recarrega para aplicar novo estado
                }, 1500)

            } else {
                console.warn("Contexto de tenant/branch não encontrado. Senha alterada, mas flag não atualizada localmente.")
                setSuccess(true)
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            }

        } catch (err) {
            console.error("Erro ao alterar senha:", err)
            setError("Erro ao alterar senha: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} backdrop="static" keyboard={false} centered>
            <ModalHeader className="bg-primary text-white">
                Alteração de Senha Obrigatória
            </ModalHeader>
            <ModalBody>
                <p className="text-muted">
                    Este é seu primeiro acesso. Por segurança, você deve redefinir sua senha (diferente de <strong>123456</strong>).
                </p>

                {error && <Alert color="danger">{error}</Alert>}
                {success && <Alert color="success">Senha alterada com sucesso! Redirecionando...</Alert>}

                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label>Nova Senha</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite a nova senha"
                            required
                            minLength={6}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Confirmar Nova Senha</Label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirme a nova senha"
                            required
                            minLength={6}
                        />
                    </FormGroup>
                    <div className="d-grid">
                        <Button color="primary" type="submit" disabled={loading || success}>
                            {loading ? "Salvando..." : "Alterar Senha e Acessar"}
                        </Button>
                    </div>
                </Form>
            </ModalBody>
        </Modal>
    )
}

export default ForcePasswordChangeModal
