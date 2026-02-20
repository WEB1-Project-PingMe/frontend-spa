import { AppSidebar } from "./app-sidebar";
import Header from "./app-header";
import ChatWindow from "./chat-window"
import { LoginForm } from "./login-form"
import ExploreComp from "./explore"
import { 
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Routes, Route } from 'react-router'
import { useLocation, useParams } from "react-router-dom"
import { Outlet } from "react-router-dom"

function ChatLayoutGrid() {
  const { pathname } = useLocation();
  const params = useParams();
  const identifier = params["*"];


  return (
    <>
     <SidebarProvider
          style={
            {
              "--sidebar-width": "364px",
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <SidebarInset>
            <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
              <SidebarTrigger className="-ml-1" />
            </header>
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
    </>
  )
}

export default ChatLayoutGrid
