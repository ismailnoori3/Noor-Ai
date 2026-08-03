import { motion } from "framer-motion";
import { Bot, User, Copy, Check, RotateCcw, Download, ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ChatMessage({ message, index, onRegenerate }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isImage = (url) => {
    return url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"} mb-6 group`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
        isUser 
          ? "bg-gradient-to-br from-blue-500 to-purple-500" 
          : "bg-gradient-to-br from-emerald-400 to-cyan-400"
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className={`flex-1 max-w-3xl ${isUser ? "flex justify-end" : ""}`}>
        <div className="space-y-3">
          <div className={`rounded-2xl px-6 py-4 shadow-md ${
            isUser 
              ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white" 
              : "bg-white text-slate-800 border border-slate-200"
          }`}>
            {/* File Attachments */}
            {message.file_urls && message.file_urls.length > 0 && (
              <div className="mb-3 space-y-2">
                {message.file_urls.map((fileUrl, idx) => (
                  <div key={idx}>
                    {isImage(fileUrl) ? (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={fileUrl} 
                          alt={message.file_names?.[idx] || 'Attached image'} 
                          className="max-w-full rounded-lg border-2 border-white/20 hover:border-white/40 transition-all cursor-pointer"
                        />
                      </a>
                    ) : (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          isUser ? "bg-white/10 hover:bg-white/20" : "bg-slate-50 hover:bg-slate-100"
                        } transition-colors`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm truncate flex-1">
                          {message.file_names?.[idx] || 'Attached file'}
                        </span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Message Content */}
            {message.content && (
              isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-slate max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )
            )}
          </div>

          {/* Action Buttons */}
          {!isUser && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 text-slate-600 hover:text-slate-800"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="h-8 text-slate-600 hover:text-slate-800"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
