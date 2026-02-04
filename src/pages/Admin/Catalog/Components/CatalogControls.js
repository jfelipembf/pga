import React from "react"
import { Button, Input } from "reactstrap"

export const CatalogTabs = ({ activeTab, onChangeTab }) => {
  return (
    <div className="d-flex gap-2">
      {[
        { key: "products", label: "Produtos" },
        { key: "services", label: "Serviços" },
      ].map(tab => (
        <Button
          key={tab.key}
          color={activeTab === tab.key ? "primary" : "light"}
          size="sm"
          onClick={() => onChangeTab(tab.key)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}

export const CatalogSideControls = ({ searchTerm, onSearch, onNew, isProductsTab }) => {
  return (
    <div className="d-flex gap-2 align-items-center side-menu__controls">
      <Input
        type="search"
        placeholder={`Buscar ${isProductsTab ? "produtos" : "serviços"}...`}
        value={searchTerm}
        onChange={e => onSearch(e.target.value)}
        style={{ flex: "0 0 60%" }}
      />
      <Button
        color="primary"
        onClick={onNew}
        className="d-flex align-items-center gap-2 justify-content-center side-menu__new-btn"
        style={{ flex: "0 0 40%", whiteSpace: "nowrap" }}
      >
        <i className="mdi mdi-plus" />
        {isProductsTab ? "Novo produto" : "Novo serviço"}
      </Button>
    </div>
  )
}
