import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare, Plus, Menu, History } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      return await base44.entities.Conversation.list('-last_message_date', 20);
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar className="border-r border-slate-200 bg-white/80 backdrop-blur-xl">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Aether Chat
                </h2>
                <p className="text-xs text-slate-500">AI Powered Assistant</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 rounded-lg mb-2 group"
                    >
                      <Link to={createPageUrl("Chat")} className="flex items-center gap-3 px-3 py-3">
                        <Plus className="w-5 h-5 text-blue-600 group-hover:rotate-90 transition-transform duration-200" />
                        <span className="font-semibold text-slate-700">New Chat</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {conversations.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 py-2 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Recent Conversations
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {conversations.map((conversation) => (
                      <SidebarMenuItem key={conversation.id}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-slate-50 transition-colors duration-200 rounded-lg mb-1 ${
                            location.search.includes(conversation.id) ? 'bg-slate-100' : ''
                          }`}
                        >
                          <Link 
                            to={createPageUrl("Chat") + "?conversation=" + conversation.id} 
                            className="flex flex-col items-start gap-1 px-3 py-2"
                          >
                            <span className="font-medium text-slate-700 text-sm truncate w-full">
                              {conversation.title}
                            </span>
                            <span className="text-xs text-slate-400">
                              {format(new Date(conversation.last_message_date), 'MMM d, h:mm a')}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 md:hidden shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Aether Chat
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>

      <style>{`
        :root {
          --primary: 217 91% 60%;
          --primary-foreground: 0 0% 100%;
        }
      `}</style>
    </SidebarProvider>
  );
}
