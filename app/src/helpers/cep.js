const CEP_API_URL = "https://viacep.com.br/ws"

export const normalizeCep = value => {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 8)
}

export const fetchAddressByCep = async rawCep => {
  const cep = normalizeCep(rawCep)
  if (cep.length !== 8) return null

  try {
    const response = await fetch(`${CEP_API_URL}/${cep}/json/`)
    if (!response.ok) return null
    const data = await response.json()
    if (data?.erro) return null

    return {
      zip: cep,
      state: data.uf || "",
      city: data.localidade || "",
      neighborhood: data.bairro || "",
      address: data.logradouro || "",
      complement: data.complemento || "",
    }
  } catch {
    return null
  }
}
