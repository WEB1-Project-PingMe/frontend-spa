import { LogOut } from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

type UserData = {
    name: string
    email: string
    avatar: string
}

export function NavUser({
    user,
}: {
    user: {
        name: string
        email: string
        avatar: string
    }
}) {
    const navigate = useNavigate()
    const { isMobile } = useSidebar()

    const deleteSessionToken = () => {
        localStorage.removeItem("sessionToken")
        localStorage.removeItem("currentUserId")
        navigate("/login", { state: { forceToLogin: true } })
    }

    const { data: userData } = useQuery<UserData>({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const userId = localStorage.getItem("currentUserId")
            const token = localStorage.getItem("sessionToken")

            if (!userId) {
                return { name: "", email: "", avatar: "" }
            }

            const response = await fetch("https://pingme-backend-nu.vercel.app/users/" + userId, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            })

            if (!response.ok) {
                throw new Error("Failed to fetch user profile")
            }

            const data = await response.json()
            return data.user as UserData
        },
        staleTime: 5 * 60_000,
    })

    const safeUser = userData ?? user

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" className="md:h-8 md:p-0">
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarFallback className="rounded-lg">
                                    {safeUser.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage alt={safeUser.name} />
                                    <AvatarFallback className="rounded-lg"></AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{safeUser.name}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={deleteSessionToken}>
                            <LogOut />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
