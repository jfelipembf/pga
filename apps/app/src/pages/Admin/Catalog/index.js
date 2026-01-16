import React, { useEffect, useMemo, useState } from "react"
import { connect } from "react-redux"
import { Col, Container, Row } from "reactstrap"

import SideMenu from "components/Common/SideMenu"
import { ProductForm } from "./Components"
import { ServiceForm } from "./Components"
import { CatalogTabs, CatalogSideControls } from "./Components"

import { setBreadcrumbItems } from "../../../store/actions"
import { useToast } from "components/Common/ToastProvider"
import PageLoader from "../../../components/Common/PageLoader"
import { useLoading } from "../../../hooks/useLoading"

import { useCatalogData } from "./Hooks/useCatalogData"
import { useCatalogSelection } from "./Hooks/useCatalogSelection"
import { getCatalogSearchKeys, filterCatalogItems } from "./Utils/index"

const CatalogPage = ({ setBreadcrumbItems }) => {
  const [activeTab, setActiveTab] = useState("products")
  const [searchTerm, setSearchTerm] = useState("")
  const [isInitializing, setIsInitializing] = useState(true)
  const toast = useToast()
  const { isLoading, withLoading } = useLoading()

  const catalog = useCatalogData({ withLoading, toast })
  const selection = useCatalogSelection({ activeTab })

  useEffect(() => {
    const breadcrumbItems = [
      { title: "Administrativo", link: "/admin" },
      { title: "Produtos e Serviços", link: "/admin/catalog" },
    ]
    setBreadcrumbItems("Produtos e Serviços", breadcrumbItems)
  }, [setBreadcrumbItems])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const { products, services } = await catalog.load()
      if (!mounted) return
      selection.ensureSelection(products, services)
      setIsInitializing(false)
    }
    run()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.load, selection.ensureSelection])

  const isProductsTab = selection.isProductsTab
  const dataset = isProductsTab ? catalog.products : catalog.services

  const searchKeys = useMemo(() => getCatalogSearchKeys(isProductsTab), [isProductsTab])

  const filteredItems = useMemo(() => {
    return filterCatalogItems({ dataset, searchTerm, searchKeys })
  }, [dataset, searchTerm, searchKeys])

  const sideMenuItems = useMemo(() => {
    return filteredItems.map(item => ({
      id: item.id,
      title: item.name,
      subtitle: item.category,
      meta: `R$ ${Number(item.price || 0).toFixed(2)}`,
      helper: isProductsTab ? `Estoque: ${item.stock ?? 0}` : `${item.duration ?? 0} min`,
    }))
  }, [filteredItems, isProductsTab])

  const currentSelection = useMemo(() => {
    return selection.currentSelection({
      products: catalog.products,
      services: catalog.services,
    })
  }, [selection, catalog.products, catalog.services])

  const isDraftSelected = selection.isDraftSelected

  const handleChange = updated => {
    if (!updated) return

    // Se for draft, salva no draft
    if (isProductsTab && selection.productDraft && updated.id === selection.productDraft.id) {
      selection.setProductDraft(updated)
      return
    }
    if (!isProductsTab && selection.serviceDraft && updated.id === selection.serviceDraft.id) {
      selection.setServiceDraft(updated)
      return
    }

    // senão, atualiza localmente na lista (edição otimista)
    if (isProductsTab) {
      catalog.setProducts(prev =>
        prev.map(p => (p.id === updated.id ? { ...p, ...updated, photo: updated.preview || p.photo } : p))
      )
    } else {
      catalog.setServices(prev =>
        prev.map(s => (s.id === updated.id ? { ...s, ...updated, photo: updated.preview || s.photo } : s))
      )
    }
  }

  const handleSave = async updated => {
    if (!updated) return

    const res = await catalog.saveItem({
      isProductsTab,
      item: updated,
      isDraft: isDraftSelected,
    })

    if (!res?.ok) return

    selection.clearDraft()

    if (res.createdId) selection.setSelectedToId(res.createdId)

    toast.show({ title: "Salvo com sucesso", color: "success" })
  }

  const headerTabsEl = (
    <CatalogTabs
      activeTab={activeTab}
      onChangeTab={tab => {
        setActiveTab(tab)
        setSearchTerm("")
      }}
    />
  )

  const sideControlsEl = (
    <CatalogSideControls
      searchTerm={searchTerm}
      onSearch={setSearchTerm}
      onNew={() => selection.newItem()}
      isProductsTab={isProductsTab}
    />
  )

  const showPageLoader = (isLoading("page") || isInitializing) && !catalog.products.length && !catalog.services.length

  return (
    <Container fluid>
      {showPageLoader ? (
        <PageLoader />
      ) : (
        <Row className="g-4">
          <Col lg="4">
            <SideMenu
              title="Itens cadastrados"
              description="Gerencie o catálogo interno de vendas."
              items={sideMenuItems}
              selectedId={selection.selectedId}
              onSelect={selection.selectItem}
              emptyLabel="Nenhum item cadastrado."
              headerActions={headerTabsEl}
              extraControls={sideControlsEl}
            />
          </Col>

          <Col lg="8">
            {isProductsTab ? (
              <ProductForm value={currentSelection} onChange={handleChange} onSave={handleSave} />
            ) : (
              <ServiceForm value={currentSelection} onChange={handleChange} onSave={handleSave} />
            )}
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(CatalogPage)
