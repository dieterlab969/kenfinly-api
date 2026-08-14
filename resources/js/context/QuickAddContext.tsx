import React, { createContext, useContext, useState, useCallback } from 'react'

export type QuickAddType = 'income' | 'expense' | 'transfer'

interface QuickAddContextValue {
    pendingAction: QuickAddType | null
    triggerQuickAdd: (type: QuickAddType) => void
    clearQuickAdd: () => void
}

const QuickAddContext = createContext<QuickAddContextValue>({
    pendingAction: null,
    triggerQuickAdd: () => {},
    clearQuickAdd: () => {},
})

export const useQuickAdd = () => useContext(QuickAddContext)

export const QuickAddProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pendingAction, setPendingAction] = useState<QuickAddType | null>(null)

    const triggerQuickAdd = useCallback((type: QuickAddType) => {
        setPendingAction(type)
    }, [])

    const clearQuickAdd = useCallback(() => {
        setPendingAction(null)
    }, [])

    return (
        <QuickAddContext.Provider value={{ pendingAction, triggerQuickAdd, clearQuickAdd }}>
            {children}
        </QuickAddContext.Provider>
    )
}
