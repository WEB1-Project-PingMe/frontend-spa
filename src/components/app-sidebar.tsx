"use client"

import { File, Inbox, CircleUser, Bot } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { NavLink } from "react-router"
import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { SearchUserDialog } from "./search-user-dialog"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

type NavMainItem = {
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
    isActive: boolean
}

// {
//     "_id": "69981bdab2a125fc56815923",
//     "participants": [
//         {
//             "_id": "69947446ae7ba15e645c13de",
//             "name": "firefox",
//             "tag": "8Ulgj0C5"
//         }
//     ],
//     "lastMessageAt": "2026-02-20T11:05:38.513Z",
//     "lastMessageText": "Test Nachricht",
//     "updatedAt": "2026-02-20T11:05:38.619Z",
//     "createdAt": "2026-02-20T08:31:22.969Z"
// }
type Conversation = {
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

const data: {
    user: {
        name: string
        email: string
        avatar: string
    }
    navMain: NavMainItem[]
} = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "pingME",
            url: "chats",
            icon: Inbox,
            isActive: true,
        },
        {
            title: "Explore",
            url: "explore",
            icon: File,
            isActive: false,
        },
    ],
}

const exploreConversations: Conversation[] = [
    {
        _id: "explore-1",
        lastMessageAt: new Date().toISOString(),
        lastMessageText: "Current weather update",
        updatedAt: new Date().toISOString(),
        participants: [
            {
                _id: "user-1",
                name: "Weather Bot",
                tag: "exploreuser1#1234",
            },
        ],
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const navigate = useNavigate()
    const [activeItem, setActiveItem] = useState(data.navMain[0])
    const { setOpen } = useSidebar()

    const token = localStorage.getItem("sessionToken")
    const { data: conversations = [] } = useQuery<Conversation[]>({
        queryKey: ["conversations", token],
        queryFn: async () => {
            const response = await fetch("https://pingme-backend-nu.vercel.app/conversations", {
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            })

            if (response.status === 401) {
                navigate("/login")
                return []
            }

            if (!response.ok) {
                throw new Error("Failed to fetch conversations")
            }

            const data = await response.json()
            return (data.conversations as Conversation[] | undefined) ?? []
        },
        staleTime: 30_000,
    })

    const displayConversations = useMemo(() => {
        if (activeItem.url === "explore") {
            return exploreConversations
        }
        return conversations
    }, [activeItem.url, conversations])

    return (
        <Sidebar
            collapsible="icon"
            className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
            {...props}
        >
            <Sidebar collapsible="none" className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent className="px-1.5 md:px-0">
                            <SidebarMenu>
                                {data.navMain.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            tooltip={{
                                                children: item.title,
                                                hidden: false,
                                            }}
                                            onClick={() => {
                                                setActiveItem(item)
                                                setOpen(true)
                                                navigate("/" + item.url)
                                            }}
                                            isActive={activeItem?.title === item.title}
                                            className="px-2.5 md:px-2"
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <NavUser user={data.user} />
                </SidebarFooter>
            </Sidebar>

            <Sidebar collapsible="none" className="hidden flex-1 md:flex">
                <SidebarHeader className="gap-3.5 border-b p-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="text-foreground text-base font-medium">{activeItem?.title}</div>
                        <SearchUserDialog />
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup className="px-0">
                        <SidebarGroupContent>
                            {activeItem.url === "explore" &&
                                displayConversations.map((chat) => (
                                    <NavLink
                                        to={"/explore/" + chat.participants[0].name}
                                        key={chat._id}
                                        state={{ chatId: chat._id }}
                                        className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-4 border-b pl-4 py-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                                    >
                                        <Bot size={32} />
                                        <div className="flex w-[75%] flex-col">
                                            <div className="flex w-full items-center gap-2">
                                                <span>{chat.participants[0].name}</span>
                                                <span className="ml-auto text-xs">{formatDistanceToNow(new Date(chat.lastMessageAt || chat.updatedAt))}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground truncate">{chat.lastMessageText}</span>
                                        </div>
                                    </NavLink>
                                ))}
                            {activeItem.url === "chats" &&
                                displayConversations.map((chat) => (
                                    <NavLink
                                        to={"/chats/" + chat._id}
                                        key={chat._id}
                                        state={{ chatId: chat._id }}
                                        className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-4 border-b pl-4 py-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                                    >
                                        <CircleUser size={32} />
                                        <div className="flex w-[75%] flex-col">
                                            <div className="flex w-full items-center gap-2">
                                                <span>{chat.participants[0]?.name}</span>{" "}
                                                <span className="ml-auto text-xs">{formatDistanceToNow(new Date(chat.lastMessageAt || chat.updatedAt))}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground truncate">{chat.lastMessageText}</span>
                                        </div>
                                    </NavLink>
                                ))}
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </Sidebar>
    )
}
