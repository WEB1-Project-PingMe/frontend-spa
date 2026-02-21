'use client'

import { formatDistanceToNow } from 'date-fns'
import { Bot } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useIsMobile } from '@/hooks/use-mobile'

type ExploreConversation = {
    _id: string
    updatedAt: string
    lastMessageAt: string
    lastMessageText: string
    participants: Array<{
        _id: string
        name: string
        tag: string
    }>
}

const exploreConversations: ExploreConversation[] = [
    {
        _id: 'explore-weather-bot',
        lastMessageAt: new Date().toISOString(),
        lastMessageText: 'Current weather update',
        updatedAt: new Date().toISOString(),
        participants: [
            {
                _id: 'user-1',
                name: 'Weather Bot',
                tag: 'exploreuser1#1234',
            },
        ],
    },
]

function ExploreIndex() {
    const isMobile = useIsMobile()

    if (!isMobile) {
        return null
    }

    return (
        <div className="h-full overflow-y-auto">
            {exploreConversations.map((chat) => (
                <NavLink
                    to={`/explore/${chat.participants[0].name}`}
                    key={chat._id}
                    state={{ chatId: chat._id }}
                    className="hover:bg-accent/60 flex items-center gap-3 border-b px-4 py-4 text-sm leading-tight"
                >
                    <Bot size={28} />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex w-full items-center gap-2">
                            <span>{chat.participants[0].name}</span>
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

export default ExploreIndex
