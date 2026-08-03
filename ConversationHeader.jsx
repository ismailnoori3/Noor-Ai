import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ConversationHeader({ 
  conversation, 
  messages, 
  onExport, 
  onClear 
}) {
  return (
    <div className="border-b border-slate-200 bg-white/80 backdrop-blur-xl p-4 md:p-6 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">
              {conversation?.title || "New Conversation"}
            </h2>
            <p className="text-sm text-slate-500">
              {messages.length} messages
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="hidden md:flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear this conversation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all messages in this conversation. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClear} className="bg-red-600 hover:bg-red-700">
                  Clear Conversation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
