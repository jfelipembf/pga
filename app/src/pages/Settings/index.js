import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { Card, CardBody, CardHeader, Container } from "reactstrap"

import SettingsGeneral from "./Components/SettingsGeneral"
import SettingsConfig from "./Components/SettingsConfig"
import { setBreadcrumbItems } from "../../store/actions"
import { getSettings, saveSettings } from "../../services/Settings/index"
import { useToast } from "components/Common/ToastProvider"
import PageLoader from "../../components/Common/PageLoader"
import ButtonLoader from "../../components/Common/ButtonLoader"
import { useLoading } from "../../hooks/useLoading"
import { DEFAULT_FINANCE_SETTINGS, DEFAULT_SALES_SETTINGS, DEFAULT_GENERAL_SETTINGS } from "./Constants/defaults"

const SettingsPage = ({ setBreadcrumbItems }) => {
  const [activeTab, setActiveTab] = useState("geral")
  const [general, setGeneral] = useState(DEFAULT_GENERAL_SETTINGS)
  const [logoPreview, setLogoPreview] = useState("")
  const toast = useToast()
  const { isLoading, withLoading } = useLoading()

  const [finance, setFinance] = useState(DEFAULT_FINANCE_SETTINGS)

  const [sales, setSales] = useState(DEFAULT_SALES_SETTINGS)

  useEffect(() => {
    const breadcrumbs = [
      { title: "Configurações", link: "/settings" },
    ]
    setBreadcrumbItems("Configurações", breadcrumbs)
  }, [setBreadcrumbItems])

  useEffect(() => {
    const load = async () => {
      try {
        await withLoading('page', async () => {
          const settings = await getSettings()
          if (settings) {
            setGeneral(settings.general || general)
            setFinance(settings.finance || finance)
            setSales(settings.sales || sales)
            setLogoPreview(settings.general?.logo || "")
          }
        })
      } catch (e) {
        console.error(e)
        toast.show({ title: "Erro ao carregar configurações", description: e?.message || String(e), color: "danger" })
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateGeneral = (field, value) => setGeneral(prev => ({ ...prev, [field]: value }))
  const updateFinance = (field, value) => setFinance(prev => ({ ...prev, [field]: value }))
  const updateSales = (field, value) => setSales(prev => ({ ...prev, [field]: value }))

  const handleLogoChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result
      setLogoPreview(dataUrl)
      setGeneral(prev => ({ ...prev, logo: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const addBankAccount = account => {
    const id = `bank-${Date.now()}`
    const next = [...finance.bankAccounts, { id, ...account }]
    setFinance(prev => ({ ...prev, bankAccounts: next, selectedBankAccount: id }))
  }

  const handleSave = async () => {
    try {
      await withLoading('save', async () => {
        await saveSettings({ general, finance, sales })
        toast.show({ title: "Configurações salvas", color: "success" })
      })
    } catch (e) {
      console.error(e)
      toast.show({ title: "Erro ao salvar", description: e?.message || String(e), color: "danger" })
    }
  }

  if (isLoading('page')) {
    return <PageLoader />
  }

  return (
    <Container fluid className="client-profile client-settings">
      <Card className="shadow-sm">
        <CardHeader className="bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="client-contracts__tabs">
            {[
              { key: "geral", label: "Geral" },
              { key: "config", label: "Configuração" },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`client-profile__tab ${activeTab === tab.key ? "client-profile__tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <ButtonLoader
            color="primary"
            onClick={handleSave}
            loading={isLoading('save')}
          >
            Salvar
          </ButtonLoader>
        </CardHeader>
        <CardBody>
          <>
            {activeTab === "geral" && (
              <SettingsGeneral
                value={general}
                logoPreview={logoPreview}
                onLogoChange={handleLogoChange}
                onChange={updateGeneral}
              />
            )}

            {activeTab === "config" && (
              <SettingsConfig
                finance={finance}
                sales={sales}
                onFinanceChange={updateFinance}
                onSalesChange={updateSales}
                onAddBankAccount={addBankAccount}
                onSelectBankAccount={val => updateFinance("selectedBankAccount", val)}
              />
            )}
          </>
        </CardBody>
      </Card>
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(SettingsPage)
