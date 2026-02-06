import React from 'react'

const AutomationList = React.lazy(() => import('../../pages/Automation/AutomationList'))

export const automationRoutes = {
    path: '/automation',
    meta: {
        title: 'Automação',
        icon: 'robot',
        showInMenu: true,
        category: 'GESTÃO',
        roles: ['admin', 'manager']
    },
    children: [
        {
            path: '/',
            component: AutomationList,
            meta: { title: 'Central de Automação' }
        }
    ]
}
