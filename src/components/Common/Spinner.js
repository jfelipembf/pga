import React, { useEffect } from "react"
import { Spinner } from "reactstrap";

const Spinners = ({ setLoading }) => {

    useEffect(() => {
        if (setLoading) {
            const timer = setTimeout(() => {
                setLoading(false)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [setLoading]);
    return (
        <React.Fragment>
            <Spinner color="primary" className='position-absolute top-50 start-50' />
        </React.Fragment>
    )
}

export default Spinners;