import React, { useMemo, useState } from "react"
import {
  Card,
  CardBody,
  Col,
  Input,
  Label,
  Pagination,
  PaginationItem,
  PaginationLink,
  Row,
  Table,
  Button,
} from "reactstrap"

const BasicTable = ({
  columns = [],
  data = [],
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
  searchPlaceholder = "Buscar...",
  onNewClick = () => { },
  searchKeys,
  onRowClick,
}) => {
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")

  const filteredData = useMemo(() => {
    if (!search) return data
    const query = search.toLowerCase()
    return data.filter(item => {
      if (Array.isArray(searchKeys) && searchKeys.length) {
        return searchKeys.some(key => String(item[key] ?? "").toLowerCase().includes(query))
      }
      return JSON.stringify(item).toLowerCase().includes(query)
    })
  }, [data, search, searchKeys])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const handlePageChange = newPage => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = e => {
    const newSize = Number(e.target.value)
    setPageSize(newSize)
    setCurrentPage(1)
  }

  return (
    <Card>
      <CardBody>
        <Row className="align-items-center g-3 mb-3">
          <Col lg="6" className="d-flex align-items-center gap-2">
            <Label for="tablePageSize" className="mb-0 text-muted">
              Mostrar
            </Label>
            <Input
              type="select"
              id="tablePageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{ maxWidth: 100 }}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Input>
            <span className="text-muted">por página</span>
          </Col>
          <Col lg="6">
            <div className="d-flex align-items-center justify-content-lg-end justify-content-start gap-2 flex-nowrap">
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ minWidth: 220 }}
              />
              {onNewClick && (
                <Button color="primary" onClick={onNewClick}>
                  Novo
                </Button>
              )}
            </div>
          </Col>
        </Row>

        <div className="table-responsive">
          <Table className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                {columns.map(col => (
                  <th key={col.key || col.label}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length ? (
                pageData.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    onClick={() => onRowClick?.(item)}
                    style={onRowClick ? { cursor: "pointer" } : undefined}
                  >
                    {columns.map(col => (
                      <td key={col.key || col.label}>
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4 text-muted">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <PaginationItem disabled={currentPage === 1}>
              <PaginationLink previous onClick={() => handlePageChange(currentPage - 1)} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1
              return (
                <PaginationItem key={page} active={page === currentPage}>
                  <PaginationLink onClick={() => handlePageChange(page)}>{page}</PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem disabled={currentPage === totalPages}>
              <PaginationLink next onClick={() => handlePageChange(currentPage + 1)} />
            </PaginationItem>
          </Pagination>
        </div>
      </CardBody>
    </Card>
  )
}

export default BasicTable
