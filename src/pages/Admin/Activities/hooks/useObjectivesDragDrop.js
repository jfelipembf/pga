import { useState, useCallback } from 'react'

/**
 * Hook para gerenciar drag and drop de objectives e topics
 * Separa lógica de drag and drop do componente visual
 */
export const useObjectivesDragDrop = (objectives, updateObjectives) => {
    const [dragging, setDragging] = useState({ type: null, id: null, parent: null })

    const handleDragStart = useCallback((type, id, parentId = null) => {
        setDragging({ type, id, parent: parentId })
    }, [])

    const handleObjectiveDragOver = useCallback((e, overId) => {
        e.preventDefault()
        if (dragging.type !== "objective" || dragging.id === overId) return
        
        updateObjectives(prev => {
            const currentIndex = prev.findIndex(o => o.id === dragging.id)
            const overIndex = prev.findIndex(o => o.id === overId)
            const next = [...prev]
            const [moved] = next.splice(currentIndex, 1)
            next.splice(overIndex, 0, moved)
            return next
        })
    }, [dragging, updateObjectives])

    const handleTopicDragOver = useCallback((e, objId, overId) => {
        e.preventDefault()
        if (dragging.type !== "topic" || dragging.parent !== objId || dragging.id === overId) return
        
        updateObjectives(prev =>
            prev.map(o => {
                if (o.id !== objId) return o
                const nextTopics = [...o.topics]
                const currentIndex = nextTopics.findIndex(t => t.id === dragging.id)
                const overIndex = nextTopics.findIndex(t => t.id === overId)
                const [moved] = nextTopics.splice(currentIndex, 1)
                nextTopics.splice(overIndex, 0, moved)
                return { ...o, topics: nextTopics }
            })
        )
    }, [dragging, updateObjectives])

    const resetDrag = useCallback(() => {
        setDragging({ type: null, id: null, parent: null })
    }, [])

    const moveObjective = useCallback((id, direction) => {
        updateObjectives(prev => {
            const index = prev.findIndex(o => o.id === id)
            const targetIndex = index + direction
            if (targetIndex < 0 || targetIndex >= prev.length) return prev
            const next = [...prev]
            const [moved] = next.splice(index, 1)
            next.splice(targetIndex, 0, moved)
            return next
        })
    }, [updateObjectives])

    const moveTopic = useCallback((objId, topicId, direction) => {
        updateObjectives(prev =>
            prev.map(o => {
                if (o.id !== objId) return o
                const idx = o.topics.findIndex(t => t.id === topicId)
                const target = idx + direction
                if (target < 0 || target >= o.topics.length) return o
                const nextTopics = [...o.topics]
                const [moved] = nextTopics.splice(idx, 1)
                nextTopics.splice(target, 0, moved)
                return { ...o, topics: nextTopics }
            })
        )
    }, [updateObjectives])

    return {
        dragging,
        handleDragStart,
        handleObjectiveDragOver,
        handleTopicDragOver,
        resetDrag,
        moveObjective,
        moveTopic
    }
}
