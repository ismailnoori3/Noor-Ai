import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import WelcomeScreen from "../components/chat/WelcomeScreen";
import ConversationHeader from "../components/chat/ConversationHeader";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const conversationId = searchParams.get("conversation");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const conversations = await base44.entities.Conversation.filter({ id: conversationId });
      return conversations[0] || null;
    },
    enabled: !!conversationId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return await base44.entities.Message.filter(
        { conversation_id: conversationId },
        'created_date'
      );
    },
    enabled: !!conversationId,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createConversationMutation = useMutation({
    mutationFn: async (firstMessage) => {
      const conversation = await base44.entities.Conversation.create({
        title: firstMessage.substring(0, 50) + (firstMessage.length > 50 ? "..." : ""),
        last_message_date: new Date().toISOString(),
      });
      return conversation;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, userMessage, files }) => {
      // Save user message with files
      await base44.entities.Message.create({
        conversation_id: conversationId,
        role: "user",
        content: userMessage,
        file_urls: files?.map(f => f.url) || [],
        file_names: files?.map(f => f.name) || [],
      });

      // Get conversation history for context
      const history = await base44.entities.Message.filter(
        { conversation_id: conversationId },
        'created_date'
      );

      // Build context from history (exclude files from context to keep it clean)
      const contextMessages = history
        .slice(-10) // Last 10 messages for context
        .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n");

      // Call AI with context and files
      const prompt = contextMessages + `\n\nUser: ${userMessage}\n\nAssistant:`;
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: files?.map(f => f.url) || undefined,
      });

      // Save AI response
      await base44.entities.Message.create({
        conversation_id: conversationId,
        role: "assistant",
        content: response,
      });

      // Update conversation last message date
      await base44.entities.Conversation.update(conversationId, {
        last_message_date: new Date().toISOString(),
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  const handleSendMessage = async (message, files = []) => {
    setIsGenerating(true);

    try {
      let currentConversationId = conversationId;

      // Create new conversation if needed
      if (!currentConversationId) {
        const newConversation = await createConversationMutation.mutateAsync(message || "New conversation");
        currentConversationId = newConversation.id;
        setSearchParams({ conversation: currentConversationId });
      }

      // Send message
      await sendMessageMutation.mutateAsync({
        conversationId: currentConversationId,
        userMessage: message,
        files: files,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleExport = () => {
    const exportText = messages.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}\n${msg.file_urls?.length ? `Files: ${msg.file_urls.join(', ')}\n` : ''}`
    ).join('\n---\n');

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = async () => {
    if (!conversationId) return;
    
    try {
      // Delete all messages in this conversation
      const messagesToDelete = await base44.entities.Message.filter({ conversation_id: conversationId });
      await Promise.all(messagesToDelete.map(msg => base44.entities.Message.delete(msg.id)));
      
      // Delete the conversation
      await base44.entities.Conversation.delete(conversationId);
      
      // Navigate to new chat
      navigate(createPageUrl("Chat"));
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    } catch (error) {
      console.error("Error clearing conversation:", error);
    }
  };

  const handleRegenerate = async () => {
    if (messages.length < 2) return;
    
    try {
      // Delete the last assistant message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        await base44.entities.Message.delete(lastMessage.id);
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
      
      // Get the last user message
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find(msg => msg.role === "user");
      
      if (lastUserMessage) {
        // Regenerate response
        setIsGenerating(true);
        
        const history = await base44.entities.Message.filter(
          { conversation_id: conversationId },
          'created_date'
        );

        const contextMessages = history
          .slice(-10)
          .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
          .join("\n\n");

        const response = await base44.integrations.Core.InvokeLLM({
          prompt: contextMessages,
          file_urls: lastUserMessage.file_urls || undefined,
        });

        await base44.entities.Message.create({
          conversation_id: conversationId,
          role: "assistant",
          content: response,
        });

        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Error regenerating:", error);
      setIsGenerating(false);
    }
  };

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {conversationId && messages.length > 0 && (
        <ConversationHeader
          conversation={conversation}
          messages={messages}
          onExport={handleExport}
          onClear={handleClear}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="max-w-4xl mx-auto p-6">
            {messages.map((message, index) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                index={index}
                onRegenerate={index === messages.length - 1 && message.role === "assistant" ? handleRegenerate : null}
              />
            ))}
            {isGenerating && (
              <div className="flex gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
                <div className="flex-1 max-w-3xl">
                  <div className="rounded-2xl px-6 py-4 shadow-md bg-white text-slate-800 border border-slate-200">
                    <p className="text-slate-500">Thinking...</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white/80 backdrop-blur-xl p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={handleSendMessage} isLoading={isGenerating} />
        </div>
      </div>
    </div>
  );
}
