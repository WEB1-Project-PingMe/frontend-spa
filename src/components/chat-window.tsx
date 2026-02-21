'use client'

import {
    Chat,
    ChatViewport,
    ChatMessages,
    ChatMessageRow,
    ChatMessageBubble,
    ChatMessageTime,
    ChatMessageAvatar,
} from '@/components/chat'
import { EllipsisVertical, Trash2, User } from 'lucide-react'
import Pusher from 'pusher-js'
import { useEffect, useMemo, useState } from 'react'
import ChatInput from './chat-input'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type ChatMessage = {
    _id: string
    text: string
    senderId: string
    updatedAt: string
}

const toChatMessage = (value: unknown): ChatMessage | null => {
    if (!value || typeof value !== 'object') {
        return null
    }

    const maybeMessage = value as Partial<ChatMessage> & {
        createdAt?: string
        message?: Partial<ChatMessage> & { createdAt?: string }
    }
    const source = maybeMessage.message ?? maybeMessage
    const messageTime = source.updatedAt ?? source.createdAt

    if (!source._id || !source.text || !source.senderId || !messageTime) {
        return null
    }

    return {
        _id: String(source._id),
        text: String(source.text),
        senderId: String(source.senderId),
        updatedAt: String(messageTime),
    }
}

const sortMessages = (messages: ChatMessage[]) =>
    [...messages].sort(
        (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    )

function ChatWindow() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const location = useLocation()
    const { uuid } = useParams()
    const chatId = (location.state as { chatId?: string } | null)?.chatId
    const [input, setInput] = useState('')
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
    const token = localStorage.getItem('sessionToken')
    const userId = localStorage.getItem('currentUserId')

    const messagesQueryKey = useMemo(
        () => ['conversation-messages', chatId, uuid, token] as const,
        [chatId, token, uuid]
    )

    const { data: chat = [] } = useQuery<ChatMessage[]>({
        queryKey: messagesQueryKey,
        queryFn: async () => {
            if (!chatId) {
                return []
            }

            const response = await fetch(
                `https://pingme-backend-nu.vercel.app/conversations/messages?conversationId=${chatId}&limit=20`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                }
            )

            if (response.status === 401) {
                navigate('/login')
                return []
            }

            if (!response.ok) {
                throw new Error('Failed to fetch messages')
            }

            const data = await response.json()
            const messages = (data.messages as ChatMessage[] | undefined) ?? []
            return sortMessages(messages)
        },
        enabled: Boolean(chatId),
        staleTime: 15_000,
    })

    useEffect(() => {
        const pusherKey = 'd8e5b208992682efa26f'
        const pusherCluster = 'eu'

        if (!chatId) {
            return
        }

        const pusher = new Pusher(pusherKey, {
            cluster: pusherCluster,
            forceTLS: true,
        })

        const chatListChannel = pusher.subscribe('chat')
        const messageChannel = pusher.subscribe(`chat-${chatId}`)

        const handleNewChat = () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }

        const handleIncomingMessage = (payload: unknown) => {
            const incomingMessage = toChatMessage(payload)
            if (!incomingMessage) {
                return
            }

            queryClient.setQueryData<ChatMessage[]>(messagesQueryKey, (previous = []) => {
                const existingIds = new Set(previous.map((message) => message._id))
                if (existingIds.has(incomingMessage._id)) {
                    return previous
                }
                return sortMessages([...previous, incomingMessage])
            })

            queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }

        chatListChannel.bind('new-chat', handleNewChat)
        messageChannel.bind('new-message', handleIncomingMessage)

        return () => {
            chatListChannel.unbind('new-chat', handleNewChat)
            messageChannel.unbind('new-message', handleIncomingMessage)
            pusher.unsubscribe('chat')
            pusher.unsubscribe(`chat-${chatId}`)
            pusher.disconnect()
        }
    }, [chatId, messagesQueryKey, queryClient])

    const sendMessageMutation = useMutation({
        mutationFn: async (messageText: string) => {
            if (!chatId) {
                return null
            }

            const userMessage = {
                text: messageText,
                conversationId: chatId,
                senderId: userId,
            }

            const response = await fetch('https://pingme-backend-nu.vercel.app/conversations/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(userMessage),
            })

            if (!response.ok) {
                throw new Error('Failed to send message')
            }

            return response.json()
        },
        onSuccess: (data) => {
            setInput('')
            const messageFromResponse = toChatMessage(data)
            if (messageFromResponse) {
                queryClient.setQueryData<ChatMessage[]>(messagesQueryKey, (previous = []) => {
                    const existingIds = new Set(previous.map((message) => message._id))
                    if (existingIds.has(messageFromResponse._id)) {
                        return previous
                    }
                    return sortMessages([...previous, messageFromResponse])
                })
            }
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
        },
    })

    const deleteMessageMutation = useMutation({
        mutationFn: async (messageId: string) => {
            if (!chatId) {
                throw new Error('Missing conversation id')
            }

            const baseUrl = 'https://pingme-backend-nu.vercel.app/conversations/messages'
            const authHeaders = {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            }

            const attempts = [
                () => fetch(`${baseUrl}/${messageId}`, { method: 'DELETE', headers: authHeaders }),
                () =>
                    fetch(
                        `${baseUrl}?messageId=${encodeURIComponent(messageId)}&conversationId=${encodeURIComponent(chatId)}`,
                        {
                            method: 'DELETE',
                            headers: authHeaders,
                        }
                    ),
                () =>
                    fetch(baseUrl, {
                        method: 'DELETE',
                        headers: authHeaders,
                        body: JSON.stringify({
                            messageId,
                            conversationId: chatId,
                        }),
                    }),
            ]

            let lastError: Error | null = null

            for (const runAttempt of attempts) {
                const response = await runAttempt()

                if (response.status === 401) {
                    navigate('/login')
                    throw new Error('Unauthorized')
                }

                if (response.ok) {
                    return messageId
                }

                lastError = new Error(`Delete failed with status ${response.status}`)
            }

            throw lastError ?? new Error('Failed to delete message')
        },
        onMutate: async (messageId) => {
            setDeletingMessageId(messageId)
            await queryClient.cancelQueries({ queryKey: messagesQueryKey })
            const previousMessages = queryClient.getQueryData<ChatMessage[]>(messagesQueryKey) ?? []

            queryClient.setQueryData<ChatMessage[]>(messagesQueryKey, (current = []) =>
                current.filter((message) => message._id !== messageId)
            )

            return { previousMessages }
        },
        onError: (_error, _messageId, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(messagesQueryKey, context.previousMessages)
            }
            toast.error('Failed to delete message', { position: 'top-right' })
        },
        onSuccess: () => {
            toast.success('Message deleted', { position: 'top-right' })
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
        },
        onSettled: () => {
            setDeletingMessageId(null)
            queryClient.invalidateQueries({ queryKey: messagesQueryKey })
        },
    })

    const sendMessage = () => {
        const trimmed = input.trim()
        if (!trimmed || sendMessageMutation.isPending) {
            return
        }

        sendMessageMutation.mutate(trimmed)
    }

    return (
        <Chat>
            <div className="mx-auto flex h-full min-w-0 w-full flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-4 sm:py-6">
                <ChatViewport className="min-h-0 flex-1 justify-end">
                    <ChatMessages className="w-full py-3">
                        {chat.map((message) => (
                            <ChatMessageRow key={message._id} variant={message.senderId === userId ? 'self' : 'peer'}>
                                {message.senderId === userId ? (
                                    <div className="[grid-area:avatar] flex items-end">
                                        <ChatMessageAvatar className="ml-2">
                                            <User />
                                        </ChatMessageAvatar>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="size-7"
                                                    disabled={deletingMessageId === message._id}
                                                >
                                                    <EllipsisVertical className="size-4" />
                                                    <span className="sr-only">Message actions</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    disabled={deletingMessageId === message._id}
                                                    onClick={() => deleteMessageMutation.mutate(message._id)}
                                                >
                                                    <Trash2 className="size-4" />
                                                    Delete message
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ) : (
                                    <ChatMessageAvatar>
                                        <User />
                                    </ChatMessageAvatar>
                                )}
                                <ChatMessageTime dateTime={new Date(message.updatedAt)} />
                                <ChatMessageBubble>{message.text}</ChatMessageBubble>
                            </ChatMessageRow>
                        ))}
                    </ChatMessages>
                </ChatViewport>
                <ChatInput
                    input={input}
                    isSending={sendMessageMutation.isPending}
                    onInputChange={setInput}
                    onSend={sendMessage}
                />
            </div>
        </Chat>
    )
}

export default ChatWindow
