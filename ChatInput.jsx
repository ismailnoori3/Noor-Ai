import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Mic, MicOff, Paperclip, X, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ChatInput({ onSend, isLoading }) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Create a File-like object from Blob
        Object.defineProperty(audioBlob, 'name', {
          writable: true,
          value: 'voice-message.webm'
        });
        
        // Upload audio and transcribe
        setUploadingFiles(true);
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: audioBlob });
          
          // Use AI to transcribe
          const transcription = await base44.integrations.Core.InvokeLLM({
            prompt: "Transcribe this audio file to text. Only return the transcribed text, nothing else.",
            file_urls: [file_url]
          });
          
          setInput(prev => prev + (prev ? " " : "") + transcription);
        } catch (error) {
          console.error("Error transcribing audio:", error);
          alert("Could not transcribe audio. Please try typing instead.");
        }
        setUploadingFiles(false);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return {
            url: file_url,
            name: file.name,
            type: file.type
          };
        })
      );
      setAttachedFiles(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files. Please try again.");
    }
    setUploadingFiles(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((input.trim() || attachedFiles.length > 0) && !isLoading && !uploadingFiles) {
      onSend(input, attachedFiles);
      setInput("");
      setAttachedFiles([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-3">
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200"
            >
              {file.type.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4 text-blue-500" />
              ) : (
                <FileIcon className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-sm text-slate-700 max-w-[150px] truncate">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Shift+Enter for new line)"
          disabled={isLoading || uploadingFiles}
          className="min-h-[60px] max-h-[200px] pr-32 resize-none rounded-2xl border-2 border-slate-200 focus:border-blue-400 shadow-lg transition-all duration-200 bg-white"
        />
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        <div className="absolute right-2 bottom-2 flex gap-2">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || uploadingFiles}
            className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-md"
            size="icon"
            variant="ghost"
          >
            {uploadingFiles ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </Button>

          <Button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || uploadingFiles}
            className={`rounded-xl shadow-md transition-all duration-200 ${
              isRecording 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
            size="icon"
            variant="ghost"
          >
            {isRecording ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          <Button
            type="submit"
            disabled={(!input.trim() && attachedFiles.length === 0) || isLoading || uploadingFiles}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg transition-all duration-200"
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          Recording... Click the microphone to stop
        </div>
      )}
    </div>
  );
}
