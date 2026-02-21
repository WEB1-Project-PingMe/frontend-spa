import { AppSidebar } from "./app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom"

function ChatLayoutGrid() {
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
          <header className="bg-background sticky h-[65px] top-0 flex shrink-0 items-center gap-2 border-b p-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}

export default ChatLayoutGrid
