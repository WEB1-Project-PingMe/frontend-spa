"use client"

import { ArchiveX, Command, File, Inbox, Send, Trash2, CircleUser } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { NavLink } from 'react-router'
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Plus, Bot } from "lucide-react"
import { SearchUserDialog } from "./search-user-dialog"
import { useNavigate, useLocation } from "react-router-dom"

// This is sample data
const data = {
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
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = useState(data.navMain[0])
  const [chats, setchats] = useState(data.chats)
  const { setOpen } = useSidebar()
  const [conversations, setConversations] = useState([]);

  const [user, setUser] = useState(data.user);

  function getConversations() {
    const token = localStorage.getItem("sessionToken");
    try {
      fetch('https://pingme-backend-nu.vercel.app/conversations', {
        headers: {
          "Content-Type": "application/json",
          ...(token && {"Authorization": `Bearer ${token}`}),
        }
      })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            console.error('Unauthorized. Please check your session token.');
            navigate("/login");
          }
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setConversations(data.conversations);
      })
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  useEffect(() => {
    getConversations();
  }, []);

  const updateData = (url) => {
    // Fetch explore data here if needed
    if(url === "explore") {
      setConversations([
        {
          _id: "explore-1",
          updatedAt: new Date().toISOString(),
          participants: [
            {
              _id: "user-1",
              name: "Weather Bot",
              tag: "exploreuser1#1234",
            }
          ],
        }
      ])
    } else {
      getConversations();
    }
  }

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
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
                        updateData(item.url)
                      }}
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

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
            <SearchUserDialog />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {activeItem.url === "explore" && (
                  conversations.map((chat) => (
                    <NavLink
                      to={"/explore/" + chat.participants[0].name}
                      key={chat._id} // Changed key to ID for better stability
                      state={{ chatId: chat._id }}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-4 border-b pl-4 py-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                    >
                      <Bot size={32} />
                      <div className="flex w-[75%] flex-col">
                        <div className="flex w-full items-center gap-2">
                          <span>{chat.participants[0].name}</span>
                          <span className="ml-auto text-xs">
                            {formatDistanceToNow(new Date(chat.updatedAt))}
                          </span>
                        </div>
                      </div>
                    </NavLink>
                  ))
                )} 
               {activeItem.url === "chats" && (
                 conversations.map((chat) => (
                    <NavLink
                      to={"/chats/" + chat._id}
                      key={chat.participants[0].tag}
                      state={{ chatId: chat._id }}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-4 border-b pl-4 py-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                    >
                      <CircleUser size={32} />
                      <div className="flex w-[75%] flex-col">
                        <div className="flex w-full items-center gap-2">
                          <span>{chat.participants[0].name}</span>{" "}
                          <span className="ml-auto text-xs">{formatDistanceToNow(chat.updatedAt)}</span>
                        </div>
                      </div>
                    </NavLink>
                  ))
               )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
