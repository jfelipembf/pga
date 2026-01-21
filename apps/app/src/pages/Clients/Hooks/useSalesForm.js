import { useState, useEffect, useMemo } from "react"
import { getToday, toISODate, addDays, parseDate } from "@pga/shared"

export const useSalesForm = (itemsByTab) => {
    const [saleTab, setSaleTab] = useState("contratos")
    const [selectedItemId, setSelectedItemId] = useState("")
    const [contractStartDate, setContractStartDate] = useState(() => toISODate(getToday()))
    const [contractEndDate, setContractEndDate] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [discount, setDiscount] = useState(0)
    const [paymentTab, setPaymentTab] = useState("dinheiro")
    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        authorization: "",
        acquirer: "",
        idAcquirer: "",
        installments: 1,
        brand: "",
    })
    const [payments, setPayments] = useState([])
    const [dueDate, setDueDate] = useState("")

    const selectedItem = useMemo(() => {
        const list = itemsByTab[saleTab] || []
        return list.find(item => item.id === selectedItemId) || { total: 0, label: "", raw: null }
    }, [saleTab, selectedItemId, itemsByTab])

    useEffect(() => {
        if (saleTab === "contratos") {
            setSelectedItemId("")
        } else {
            const first = itemsByTab[saleTab]?.[0]?.id || ""
            setSelectedItemId(first)
        }
        setQuantity(1)
    }, [saleTab, itemsByTab])

    useEffect(() => {
        if (saleTab !== "contratos") {
            setContractEndDate("")
            return
        }
        const duration = Number(selectedItem?.raw?.duration || 0)
        const durationType = selectedItem?.raw?.durationType || "Meses"
        if (!contractStartDate || !duration) {
            setContractEndDate("")
            return
        }
        const start = parseDate(contractStartDate)
        if (!start) return
        
        let end
        if (durationType === "Dias") {
            end = addDays(start, duration)
        } else if (durationType === "Anos") {
            end = new Date(start.getFullYear() + duration, start.getMonth(), start.getDate())
        } else {
            // Meses
            end = new Date(start.getFullYear(), start.getMonth() + duration, start.getDate())
        }
        setContractEndDate(toISODate(end))
    }, [saleTab, selectedItem, contractStartDate])

    const computedQuantity = saleTab === "produtos" ? Math.max(Number(quantity) || 1, 1) : 1
    const baseAmount = Number(selectedItem.total || 0) * computedQuantity
    const totalDue = Math.max(baseAmount - Number(discount || 0), 0)
    const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
    const diff = totalPaid - totalDue

    const addPayment = () => {
        if (!paymentForm.amount) return
        setPayments(prev => [...prev, { ...paymentForm, type: paymentTab, id: Date.now() }])
        setPaymentForm({
            amount: "",
            authorization: "",
            acquirer: "",
            idAcquirer: "",
            installments: 1,
            brand: "",
        })
    }

    const removePayment = id => {
        setPayments(prev => prev.filter(p => p.id !== id))
    }

    return {
        saleTab, setSaleTab,
        selectedItemId, setSelectedItemId,
        contractStartDate, setContractStartDate,
        contractEndDate, setContractEndDate,
        quantity, setQuantity,
        discount, setDiscount,
        paymentTab, setPaymentTab,
        paymentForm, setPaymentForm,
        payments, setPayments,
        dueDate, setDueDate,
        selectedItem,
        computedQuantity,
        baseAmount,
        totalDue,
        diff,
        addPayment,
        removePayment
    }
}
