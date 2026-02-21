'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { CircleUser } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink } from 'react-router'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/hooks/use-mobile'

type Conversation = {
    _id: string
    updatedAt: string
    lastMessageAt: string
    lastMessageText: string
    isGroup?: boolean
    participants: Array<{
        _id: string
        name: string
        tag: string
    }>
}

function ChatsIndex() {
    const navigate = useNavigate()
    const isMobile = useIsMobile()
    const token = localStorage.getItem('sessionToken')

    const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
        queryKey: ['conversations', token],
        queryFn: async () => {
            const response = await fetch('https://pingme-backend-nu.vercel.app/conversations', {
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
                throw new Error('Failed to fetch conversations')
            }

            const data = await response.json()
            return (data.conversations as Conversation[] | undefined) ?? []
        },
        staleTime: 30_000,
    })

    const directConversations = conversations.filter(
        (conversation) => !conversation.isGroup && conversation.participants.length <= 2
    )

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return
        }

        const firstDirectConversation = directConversations[0]
        if (firstDirectConversation?._id) {
            navigate(`/chats/${firstDirectConversation._id}`, {
                replace: true,
                state: { chatId: firstDirectConversation._id },
            })
        }
    }, [directConversations, isMobile, navigate])

    if (isLoading) {
        return <div className="p-4 text-sm text-muted-foreground">Loading chats...</div>
    }

    if (directConversations.length === 0) {
        return <div className="p-4 text-sm text-muted-foreground">No chats available yet.</div>
    }

    if (!isMobile) {
        return null
    }

    return (
        <div className="h-full overflow-y-auto">
            {directConversations.map((chat) => (
                <NavLink
                    to={`/chats/${chat._id}`}
                    key={chat._id}
                    state={{ chatId: chat._id }}
                    className="hover:bg-accent/60 flex items-center gap-3 border-b px-4 py-4 text-sm leading-tight"
                >
                    <CircleUser size={28} />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex w-full items-center gap-2">
                            <span>{chat.participants[0]?.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(chat.lastMessageAt || chat.updatedAt))}
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate">{chat.lastMessageText}</span>
                    </div>
                </NavLink>
            ))}
        </div>
    )
}

export default ChatsIndex
