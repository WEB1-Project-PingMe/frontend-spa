"use client"

import {
  Chat,
  ChatViewport,
  ChatMessages,
  ChatMessageRow,
  ChatMessageBubble,
  ChatMessageTime,
  ChatMessageAvatar,
} from "@/components/chat"
import { Users } from "lucide-react"
import Pusher from "pusher-js"
import { useEffect, useMemo, useState } from "react"
import ChatInput from "./chat-input"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

type ChatMessage = {
  _id: string
  text: string
  senderId: string
  updatedAt: string
}

const toChatMessage = (value: unknown): ChatMessage | null => {
  if (!value || typeof value !== "object") {
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

function GroupsChat() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const { uuid } = useParams()
  const chatIdFromState = (location.state as { chatId?: string } | null)?.chatId
  const groupChatId = chatIdFromState ?? uuid
  const [input, setInput] = useState("")
  const token = localStorage.getItem("sessionToken")
  const userId = localStorage.getItem("currentUserId")

  const messagesQueryKey = useMemo(
    () => ["group-conversation-messages", groupChatId, token] as const,
    [groupChatId, token]
  )

  const { data: chat = [] } = useQuery<ChatMessage[]>({
    queryKey: messagesQueryKey,
    queryFn: async () => {
      if (!groupChatId) {
        return []
      }

      const response = await fetch(
        `https://pingme-backend-nu.vercel.app/conversations/messages?conversationId=${groupChatId}&limit=20`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      )

      if (response.status === 401) {
        navigate("/login")
        return []
      }

      if (!response.ok) {
        throw new Error("Failed to fetch group messages")
      }

      const data = await response.json()
      const messages = (data.messages as ChatMessage[] | undefined) ?? []
      return sortMessages(messages)
    },
    enabled: Boolean(groupChatId),
    staleTime: 15_000,
  })

  useEffect(() => {
    const pusherKey = "d8e5b208992682efa26f"
    const pusherCluster = "eu"

    if (!groupChatId) {
      return
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
    })

    const chatListChannel = pusher.subscribe("chat")
    const messageChannel = pusher.subscribe(`chat-${groupChatId}`)

    const handleNewChat = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
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

      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    }

    chatListChannel.bind("new-chat", handleNewChat)
    messageChannel.bind("new-message", handleIncomingMessage)

    return () => {
      chatListChannel.unbind("new-chat", handleNewChat)
      messageChannel.unbind("new-message", handleIncomingMessage)
      pusher.unsubscribe("chat")
      pusher.unsubscribe(`chat-${groupChatId}`)
      pusher.disconnect()
    }
  }, [groupChatId, messagesQueryKey, queryClient])

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!groupChatId) {
        return null
      }

      const userMessage = {
        text: messageText,
        conversationId: groupChatId,
        senderId: userId,
      }

      const response = await fetch("https://pingme-backend-nu.vercel.app/conversations/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(userMessage),
      })

      if (!response.ok) {
        throw new Error("Failed to send group message")
      }

      return response.json()
    },
    onSuccess: (data) => {
      setInput("")
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
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
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
              <ChatMessageRow key={message._id} variant={message.senderId === userId ? "self" : "peer"}>
                <ChatMessageAvatar>
                  <Users />
                </ChatMessageAvatar>
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

export default GroupsChat
