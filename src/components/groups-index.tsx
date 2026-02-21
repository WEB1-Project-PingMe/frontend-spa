'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Users } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/hooks/use-mobile'

type Group = {
    _id: string
    name: string
    memberIds: string[]
    createdAt: string
    updatedAt: string
}

function GroupsIndex() {
    const navigate = useNavigate()
    const isMobile = useIsMobile()
    const token = localStorage.getItem('sessionToken')

    const { data: groups = [], isLoading } = useQuery<Group[]>({
        queryKey: ['groups', token],
        queryFn: async () => {
            const response = await fetch('https://pingme-backend-nu.vercel.app/groups', {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            })

            if (response.status === 401) {
                navigate('/login')
                return []
            }

            if (!response.ok) {
                throw new Error('Failed to fetch groups')
            }

            const payload = await response.json()
            if (Array.isArray(payload)) {
                return payload as Group[]
            }
            return (payload.groups as Group[] | undefined) ?? []
        },
        staleTime: 30_000,
    })

    if (isLoading) {
        return <div className="p-4 text-sm text-muted-foreground">Loading groups...</div>
    }

    if (groups.length === 0) {
        return <div className="p-4 text-sm text-muted-foreground">No groups available yet.</div>
    }

    if (!isMobile) {
        return null
    }

    return (
        <div className="h-full overflow-y-auto">
            {groups.map((group) => (
                <NavLink
                    to={`/groups/${group._id}`}
                    key={group._id}
                    state={{ chatId: group._id }}
                    className="hover:bg-accent/60 flex items-center gap-3 border-b px-4 py-4 text-sm leading-tight"
                >
                    <Users size={28} />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex w-full items-center gap-2">
                            <span>{group.name || 'Unnamed Group'}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(group.updatedAt || group.createdAt))}
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate">{group.memberIds.length} members</span>
                    </div>
                </NavLink>
            ))}
        </div>
    )
}

export default GroupsIndex
