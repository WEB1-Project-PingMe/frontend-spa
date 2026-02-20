import {
    ChatInputArea,
    ChatInputField,
    ChatInputSubmit,
} from '@/components/chat'
import { ArrowUpIcon } from 'lucide-react'

type ChatInputProps = {
    input: string
    placeholder?: string
    isSending: boolean
    onInputChange: (value: string) => void
    onSend: () => void
}

export default function ChatInput({
    input,
    placeholder = 'Type type type!',
    isSending,
    onInputChange,
    onSend,
}: ChatInputProps) {
    const handleClickSend = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        onSend()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
        }
    }

    return (
        <ChatInputArea>
            <ChatInputField
                multiline
                placeholder={placeholder}
                value={input}
                onKeyDown={handleKeyDown}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    onInputChange(e.target.value)
                }
            />
            <ChatInputSubmit onClick={handleClickSend} disabled={!input.trim() || isSending}>
                <ArrowUpIcon className="size-[1.2em]" />
                <span className="sr-only">Send</span>
            </ChatInputSubmit>
        </ChatInputArea>
    )
}

