import { useState, useEffect } from "react"
import { getSettings } from "../services/Settings"
import { useLoading } from "./useLoading"

export const useSystemSettings = () => {
  const [settings, setSettings] = useState(null)
  const { withLoading } = useLoading()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        await withLoading("settings", async () => {
          const data = await getSettings()
          if (mounted && data) {
            setSettings(data)
          }
        })
      } catch (error) {
        console.error("Erro ao carregar configurações do sistema:", error)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [withLoading]) // Carrega apenas uma vez ao montar

  return { settings }
}
