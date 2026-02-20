'use client'

import * as React from 'react'
import {
  Chat,
  ChatInputArea,
  ChatInputField,
  ChatInputSubmit,
  ChatViewport,
  ChatMessages,
  ChatMessageRow,
  ChatMessageBubble,
  ChatMessageTime,
  ChatMessageAvatar,
  type ChatSubmitEvent,
} from '@/components/chat'
import { ArrowUpIcon, Square, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'

const MTPRZ_AVATAR = '/static/c/matiasperz.webp'
const JOYCO_AVATAR = '/static/c/joyco.webp'
const JOYBOY_AVATAR = '/static/c/joyboy.webp'
const FABROOS_AVATAR = '/static/c/fabroos.webp'

function ChatWindow() {
  const location = useLocation();
  const { uuid } = useParams();
  const { chatId } = location.state;
  const [chat, setChat] = React.useState([])
  const [input, setInput] = React.useState('')
  const token = localStorage.getItem("sessionToken");
  const userId = localStorage.getItem("currentUserId");

  useEffect(() => {
    // GET /conversations/messages?conversationId=507f1f77bcf86cd799439012&limit=20&before=2026-01-21T12:00:00.000Z
    fetch(`https://pingme-backend-nu.vercel.app/conversations/messages?conversationId=${chatId}&limit=20`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && {"Authorization": `Bearer ${token}`}),
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      const sortedMessages = data.messages.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
      setChat(sortedMessages);
    })
  }, [uuid]);

  const updateMessageContent = React.useCallback(
    (id: string, content: string) => {
      setChat((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)))
    },
    []
  )

  const { stream, abort, isStreaming } = useStreamToken(updateMessageContent)

  const sendMessage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (isStreaming) {
      abort()
      return
    }

    const userId = localStorage.getItem("currentUserId");

    const userMessage = {
      text: input,
      conversationId: chatId,
      senderId: userId,
    }
    fetch('https://pingme-backend-nu.vercel.app/conversations/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem("sessionToken") && {"Authorization": `Bearer ${localStorage.getItem("sessionToken")}`}),
      },
      body: JSON.stringify(userMessage),
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      console.log('Message sent successfully:', data);
    })
    .catch(error => {
      console.error('Error sending message:', error);
    });

  }

  const handleSubmit = (e: ChatSubmitEvent) => {
    if (isStreaming) return

    const userMessage: Message = {
      type: 'message',
      id: Date.now().toString(),
      avatar: MTPRZ_AVATAR,
      name: 'You',
      content: e.message,
      role: 'self',
      timestamp: new Date(),
    }

    setChat((prev) => [...prev, userMessage])
    setInput('')

    // Simulate assistant response with typewriter effect
    const responseText = ANSW_SET[Math.floor(Math.random() * ANSW_SET.length)]
    const assistantId = (Date.now() + 1).toString()
    const assistantTimestamp = new Date()

    setChat((prev) => [
      ...prev,
      {
        type: 'message',
        id: assistantId,
        avatar: JOYCO_AVATAR,
        name: 'Assistant',
        content: '',
        fallback: 'A',
        role: 'system',
        timestamp: assistantTimestamp,
      },
    ])

    stream(assistantId, responseText)
  }

  return (
    <Chat onSubmit={handleSubmit}>
      <div className="mx-auto flex w-full flex-col gap-4 px-4 py-6 h-full w-full">
        <ChatViewport className="h-full justify-end">
          <ChatMessages className="w-full py-3">
            {chat.map((message) => {
                return (
                  <ChatMessageRow key={message._id} 
                  variant={
                    message.senderId === userId ? 'self' : 'peer'
                  }
                  >
                    <ChatMessageAvatar>
                      <User />
                    </ChatMessageAvatar>
                    <ChatMessageTime dateTime={new Date(message.updatedAt)} />
                    <ChatMessageBubble>{message.text}</ChatMessageBubble>
                  </ChatMessageRow>
                )
            })}
          </ChatMessages>
        </ChatViewport>

        <ChatInputArea>
          <ChatInputField
            multiline
            placeholder="Type type type!"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
          />
          <ChatInputSubmit
            onClick={(e) => sendMessage(e)}
            disabled={!input.trim() && !isStreaming}
          >
            {isStreaming ? (
              <Square className="size-[1em] fill-current" />
            ) : (
              <ArrowUpIcon className="size-[1.2em]" />
            )}
            <span className="sr-only">
              {isStreaming ? 'Stop streaming' : 'Send'}
            </span>
          </ChatInputSubmit>
        </ChatInputArea>
      </div>
    </Chat>
  )
}

function useStreamToken(
  onUpdate: (id: string, content: string) => void,
  options?: { minDelay?: number; maxDelay?: number }
) {
  const { minDelay = 30, maxDelay = 80 } = options ?? {}
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isStreaming, setIsStreaming] = React.useState(false)

  const stream = React.useCallback(
    (id: string, text: string) => {
      const tokens = text.split(/(\s+)/).filter(Boolean)
      let tokenIndex = 0
      setIsStreaming(true)

      const streamToken = () => {
        if (tokenIndex >= tokens.length) {
          setIsStreaming(false)
          return
        }

        tokenIndex++
        const currentContent = tokens.slice(0, tokenIndex).join('')
        onUpdate(id, currentContent)

        const delay = minDelay + Math.random() * (maxDelay - minDelay)
        timeoutRef.current = setTimeout(streamToken, delay)
      }

      streamToken()
    },
    [onUpdate, minDelay, maxDelay]
  )

  const abort = React.useCallback(() => {
    setIsStreaming(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { stream, abort, isStreaming }
}

export default ChatWindow
