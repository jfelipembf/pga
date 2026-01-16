import React from "react"
import BasicTable from "../../common/BasicTable"
import PropTypes from "prop-types"

const TableWithPhoto = ({ columns, data, photoKey = "photo", ...props }) => {
    const photoColumn = {
        label: "Foto",
        key: photoKey,
        render: (item) => (
            <div className="avatar-xs">
                <span className="avatar-title rounded-circle bg-light text-primary">
                    {item[photoKey] ? (
                        <img
                            src={item[photoKey]}
                            alt="Avatar"
                            className="rounded-circle"
                            height="35"
                            width="35"
                            style={{ objectFit: "cover" }}
                        />
                    ) : (
                        (item.name || "U").charAt(0).toUpperCase()
                    )}
                </span>
            </div>
        ),
    }

    // Prepend photo column to existing columns
    const tableColumns = [photoColumn, ...columns]

    return <BasicTable columns={tableColumns} data={data} {...props} />
}

TableWithPhoto.propTypes = {
    columns: PropTypes.array.isRequired,
    data: PropTypes.array.isRequired,
    photoKey: PropTypes.string,
}

export default TableWithPhoto
