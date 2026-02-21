"use client"

import { File, Inbox, Users, CircleUser, Bot } from "lucide-react"

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

type Conversation = {
    _id: string
    updatedAt: string
    lastMessageAt: string
    lastMessageText: string
    isGroup?: boolean
    name?: string
    participants: Array<{
        _id: string
        name: string
        tag: string
    }>
}

type Group = {
    _id: string
    name: string
    memberIds: string[]
    createdAt: string
    updatedAt: string
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
            title: "Groups",
            url: "groups",
            icon: Users,
            isActive: false,
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
        _id: "explore-weather-bot",
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
    const { setOpen, isMobile, setOpenMobile } = useSidebar()

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

    const { data: groups = [] } = useQuery<Group[]>({
        queryKey: ["groups", token],
        queryFn: async () => {
            const response = await fetch("https://pingme-backend-nu.vercel.app/groups", {
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
                throw new Error("Failed to fetch groups")
            }

            const payload = await response.json()
            if (Array.isArray(payload)) {
                return payload as Group[]
            }
            return (payload.groups as Group[] | undefined) ?? []
        },
        staleTime: 30_000,
    })

    const directConversations = useMemo(
        () => conversations.filter((conversation) => !conversation.isGroup && conversation.participants.length <= 2),
        [conversations]
    )

    const displayConversations = useMemo(() => {
        if (activeItem.url === "explore") {
            return exploreConversations
        }
        return directConversations
    }, [activeItem.url, directConversations])

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
                                                if (isMobile) {
                                                    const firstDirectConversation = directConversations[0]
                                                    const firstGroup = groups[0]
                                                    const firstExplore = exploreConversations[0]

                                                    if (item.url === "chats" && firstDirectConversation) {
                                                        setOpenMobile(false)
                                                        navigate("/chats/" + firstDirectConversation._id, {
                                                            state: { chatId: firstDirectConversation._id },
                                                        })
                                                        return
                                                    }

                                                    if (item.url === "groups" && firstGroup) {
                                                        setOpenMobile(false)
                                                        navigate("/groups/" + firstGroup._id, {
                                                            state: { chatId: firstGroup._id },
                                                        })
                                                        return
                                                    }

                                                    if (item.url === "explore" && firstExplore) {
                                                        setOpenMobile(false)
                                                        navigate("/explore/" + firstExplore.participants[0].name, {
                                                            state: { chatId: firstExplore._id },
                                                        })
                                                        return
                                                    }
                                                }

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
                            {activeItem.url === "groups" &&
                                groups.map((group) => (
                                    <NavLink
                                        to={"/groups/" + group._id}
                                        key={group._id}
                                        state={{ chatId: group._id }}
                                        className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-4 border-b pl-4 py-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                                    >
                                        <Users size={32} />
                                        <div className="flex w-[75%] flex-col">
                                            <div className="flex w-full items-center gap-2">
                                                <span>{group.name || "Unnamed Group"}</span>
                                                <span className="ml-auto text-xs">{formatDistanceToNow(new Date(group.updatedAt || group.createdAt))}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground truncate">{group.memberIds.length} members</span>
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
