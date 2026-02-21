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
import { useQuery } from '@tanstack/react-query'
import { User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ChatInput from './chat-input'

type WeatherData = {
    last_updated: string
    temp_c: number
    wind_kph: number
    wind_degree: number
    humidity: number
    feelslike_c: number
}

type WeatherQueryResult = {
    weather: WeatherData | null
    message: string | null
}

type WeatherErrorResponse = {
    error?: string
    message?: string
}

type ExploreMessage = {
    id: string
    role: 'self' | 'peer'
    text: string
    timestamp: Date
}

function ExploreComp() {
    const token = localStorage.getItem('sessionToken')
    const routeCity = ''

    const [cityInput, setCityInput] = useState(routeCity)
    const [selectedCity, setSelectedCity] = useState('')
    const [requestSeq, setRequestSeq] = useState(0)
    const [messages, setMessages] = useState<ExploreMessage[]>([])
    const handledResponseSeqRef = useRef(0)
    const noMatchingLocationMessage = 'No matching location found.'

    useEffect(() => {
        setCityInput(routeCity)
    }, [routeCity])

    const { data, isLoading, isError } = useQuery<WeatherQueryResult>({
        queryKey: ['weather-current', selectedCity, requestSeq, token],
        queryFn: async () => {
            const response = await fetch(
                `https://pingme-backend-nu.vercel.app/weather/current?q=${encodeURIComponent(selectedCity)}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                }
            )

            if (response.status === 500) {
                const errorPayload = (await response.json().catch(() => null)) as WeatherErrorResponse | null
                if (
                    errorPayload?.error === 'WeatherAPI error' &&
                    errorPayload?.message === noMatchingLocationMessage
                ) {
                    return {
                        weather: null,
                        message: `City "${selectedCity}" not found.`,
                    }
                }
            }

            if (response.status === 404) {
                return {
                    weather: null,
                    message: `City "${selectedCity}" not found.`,
                }
            }

            if (!response.ok) {
                throw new Error('Failed to fetch weather data')
            }

            const payloadData = await response.json()
            const payload = (payloadData.current_weather ?? payloadData.current ?? payloadData.weather ?? payloadData) as
                | Partial<WeatherData>
                | undefined

            if (!payload || typeof payload !== 'object') {
                return {
                    weather: null,
                    message: 'No weather data available for this city.',
                }
            }

            return {
                weather: {
                    last_updated: String(payload.last_updated ?? ''),
                    temp_c: Number(payload.temp_c ?? 0),
                    wind_kph: Number(payload.wind_kph ?? 0),
                    wind_degree: Number(payload.wind_degree ?? 0),
                    humidity: Number(payload.humidity ?? 0),
                    feelslike_c: Number(payload.feelslike_c ?? 0),
                },
                message: null,
            }
        },
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: false,
        enabled: Boolean(selectedCity.trim()),
    })

    useEffect(() => {
        if (requestSeq === 0 || isLoading || handledResponseSeqRef.current === requestSeq) {
            return
        }

        let assistantText = ''

        if (isError) {
            assistantText = 'Could not load weather data.'
        } else if (data?.message) {
            assistantText = data.message
        } else if (data?.weather) {
            const weather = data.weather
            assistantText = `Temperature in ${selectedCity} is ${weather.temp_c}°C · Feels like ${weather.feelslike_c}°C · Humidity ${weather.humidity}%`
        }

        if (!assistantText) {
            return
        }

        handledResponseSeqRef.current = requestSeq
        setMessages((prev) => [
            ...prev,
            {
                id: `peer-${requestSeq}`,
                role: 'peer',
                text: assistantText,
                timestamp: new Date(),
            },
        ])
    }, [data, isError, isLoading, requestSeq])

    const handleCitySubmit = () => {
        const trimmedCity = cityInput.trim()
        if (!trimmedCity) {
            return
        }

        const nextSeq = requestSeq + 1

        setMessages((prev) => [
            ...prev,
            {
                id: `self-${nextSeq}`,
                role: 'self',
                text: trimmedCity,
                timestamp: new Date(),
            },
        ])

        setSelectedCity(trimmedCity)
        setRequestSeq(nextSeq)
        setCityInput('')
    }

    return (
        <Chat>
            <div className="mx-auto flex h-full min-w-0 w-full flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-4 sm:py-6">
                <ChatViewport className="min-h-0 flex-1 justify-end">
                    <ChatMessages className="w-full py-3">
                        {messages.map((message) => (
                            <ChatMessageRow key={message.id} variant={message.role}>
                                <ChatMessageAvatar>
                                    <User />
                                </ChatMessageAvatar>
                                <ChatMessageTime dateTime={message.timestamp} />
                                <ChatMessageBubble>{message.text}</ChatMessageBubble>
                            </ChatMessageRow>
                        ))}
                        {isLoading && requestSeq > 0 && (
                            <ChatMessageRow variant={'peer'}>
                                <ChatMessageAvatar>
                                    <User />
                                </ChatMessageAvatar>
                                <ChatMessageBubble>Loading weather...</ChatMessageBubble>
                            </ChatMessageRow>
                        )}
                        {messages.length === 0 && !isLoading && (
                            <ChatMessageRow variant={'peer'}>
                                <ChatMessageAvatar>
                                    <User />
                                </ChatMessageAvatar>
                                <ChatMessageBubble>Type a city name and send to get the current weather.</ChatMessageBubble>
                            </ChatMessageRow>
                        )}
                    </ChatMessages>
                </ChatViewport>
                <ChatInput
                    input={cityInput}
                    isSending={isLoading}
                    onInputChange={setCityInput}
                    onSend={handleCitySubmit}
                    placeholder="Get your city weather..."
                />
            </div>
        </Chat>
    )
}

export default ExploreComp
