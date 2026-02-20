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

function ExploreComp() {
  const location = useLocation();
  const { uuid } = useParams();
  const [weatherData, setWeatherData] = useState({
    temperature: 0,
    winddirection: 0,
    time: new Date().toISOString(),
  });
  const token = localStorage.getItem("sessionToken");
  const userId = localStorage.getItem("currentUserId");

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true')
    .then(res => res.json())
    .then(data => {
      console.log(data);
      const currentWeather = data.current_weather;
      setWeatherData(currentWeather);
    });
  }, [uuid]);

  return (
    <Chat>
      <div className="mx-auto flex w-full flex-col gap-4 px-4 py-6 h-full w-full">
        <ChatViewport className="h-full justify-end">
          <ChatMessages className="w-full py-3">
              <ChatMessageRow key={weatherData.winddirection}
              variant={'peer'}>
                <ChatMessageAvatar>
                  <User />
                </ChatMessageAvatar>
                <ChatMessageTime dateTime={new Date(weatherData.time)} />
                <ChatMessageBubble>Temperature {weatherData.temperature}</ChatMessageBubble>
              </ChatMessageRow>
          </ChatMessages>
        </ChatViewport>
      </div>
    </Chat>
  )
}

export default ExploreComp
