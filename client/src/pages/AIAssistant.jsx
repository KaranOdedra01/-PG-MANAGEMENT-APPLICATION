import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Bot, 
  Sparkles, 
  Send, 
  User, 
  Zap, 
  Copy, 
  Check, 
  MessageSquare, 
  FileText, 
  Flame, 
  Clock, 
  Trash2
} from 'lucide-react';

export const AIAssistant = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'classifier' | 'composer'

  // Chat State
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Hello ${user?.name || 'Resident'}! 👋 I am your 24/7 PG Smart Assistant powered by Gemini.

You can ask me questions about the hostel (such as **"What is today's mess menu?"**, **"Where is the nearest hospital?"**, **"How do I connect to the WiFi?"**, **"Do I have any pending invoices?"**, **"What is the status of my complaints?"**) or any general question!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatContainerRef = useRef(null);

  // Classifier State
  const [classifyTitle, setClassifyTitle] = useState('Bathroom geyser switch burning');
  const [classifyDesc, setClassifyDesc] = useState('The geyser power switch in Room 102 sparked with smoke and tripped the circuit breaker.');
  const [classifyResult, setClassifyResult] = useState(null);
  const [classifyLoading, setClassifyLoading] = useState(false);

  // Composer State (Admin)
  const [composerTenant, setComposerTenant] = useState('Rahul Sharma');
  const [composerRoom, setComposerRoom] = useState('102');
  const [composerAmount, setComposerAmount] = useState('7500');
  const [composerMonth, setComposerMonth] = useState('Current Month');
  const [composerDueDate, setComposerDueDate] = useState('');
  const [composerResult, setComposerResult] = useState(null);
  const [composerLoading, setComposerLoading] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom(true);
    }
  }, [messages, chatLoading]);

  // Smooth real-time typewriter stream for response rendering
  const typeMessageStreaming = (fullText) => {
    const msgId = 'msg-' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [
      ...prev,
      {
        id: msgId,
        sender: 'ai',
        text: '',
        time: timeStr,
        isStreaming: true
      }
    ]);

    const words = fullText.split(' ');
    let currentWordIndex = 0;
    let accumulated = '';

    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        accumulated += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex];
        currentWordIndex += 1;

        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: accumulated } : m));
        scrollToBottom(false);
      } else {
        clearInterval(interval);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStreaming: false } : m));
        setChatLoading(false);
      }
    }, 20);
  };

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || chatLoading) return;

    const userMsgId = 'user-' + Date.now();
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setChatLoading(true);

    try {
      const history = messages
        .filter(m => !m.isStreaming)
        .slice(-6)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text
        }));

      const res = await api.post('/ai/chat', { 
        message: textToSend,
        conversationHistory: history 
      });

      if (res.data?.success) {
        typeMessageStreaming(res.data.reply);
      } else {
        throw new Error(res.data?.message || 'AI Assistant is temporarily unavailable. Please try again.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'AI Assistant is temporarily unavailable. Please try again.';
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'ai',
          text: `⚠️ ${errorMsg}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setChatLoading(false);
    }
  };

  const handleClassify = async (e) => {
    e.preventDefault();
    if (!classifyDesc.trim() || classifyLoading) return;

    setClassifyLoading(true);
    setClassifyResult(null);

    try {
      const res = await api.post('/ai/classify-complaint', {
        title: classifyTitle,
        description: classifyDesc
      });
      if (res.data?.success) {
        setClassifyResult(res.data.data);
      }
    } catch {
      alert('AI Assistant is temporarily unavailable. Please try again.');
    } finally {
      setClassifyLoading(false);
    }
  };

  const handleComposeReminder = async (e) => {
    e.preventDefault();
    setComposerLoading(true);
    setComposerResult(null);

    try {
      const res = await api.post('/ai/compose-reminder', {
        tenantName: composerTenant,
        roomNumber: composerRoom,
        amount: composerAmount,
        month: composerMonth,
        dueDate: composerDueDate
      });
      if (res.data?.success) {
        setComposerResult(res.data.data);
      }
    } catch {
      alert('AI Assistant is temporarily unavailable. Please try again.');
    } finally {
      setComposerLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([
        {
          id: 'reset-msg',
          sender: 'ai',
          text: `Conversation cleared! How can I help you today?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Module 12 • Gemini AI Hub
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-cyan-400 shrink-0" />
            AI Assistant
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            24/7 intelligent PG assistant powered by Google Gemini.
          </p>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none shrink-0">
        {[
          { key: 'chat', label: '💬 Resident AI Assistant', icon: MessageSquare },
          { key: 'classifier', label: '⚡ Smart Complaint Auto-Classifier', icon: Zap },
          ...(isAdmin ? [{ key: 'composer', label: '✍️ Smart Rent Notice Composer', icon: FileText }] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: 24/7 AI CHATBOT */}
      {activeTab === 'chat' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col h-[580px] sm:h-[650px] md:h-[680px]">
          {/* Quick Prompts Bar & Controls */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 flex-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" /> Quick Ask:
              </span>
              {[
                { label: '🍽️ Today’s Food Menu', prompt: "What is for breakfast, lunch, snacks, and dinner today?" },
                { label: '🏥 Nearest Hospital & Doctor', prompt: "Where is the nearest hospital and emergency medical help?" },
                { label: '📶 Connect Hostel WiFi Steps', prompt: "How do I connect to the hostel WiFi network?" },
                { label: '🚪 Gate Curfew & Timings', prompt: "What are the hostel gate opening and closing curfew timings?" },
                { label: '💳 Check My Rent Dues', prompt: "Do I have any pending rent invoices or unpaid dues?" },
                { label: '🔧 My Complaint Status', prompt: "What is the status of my maintenance tickets?" },
                { label: '📦 Courier Delivery Policy', prompt: "How do parcel and courier deliveries work here?" }
              ].map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.prompt)}
                  className="px-3 py-1 rounded-full bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-medium border border-slate-800 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages Feed */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-none">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={msg.id} className={`flex items-start gap-3 group ${isAi ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isAi ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-indigo-600 text-white'
                  }`}>
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm relative ${
                    isAi
                      ? 'bg-slate-950 border border-slate-800 text-slate-200'
                      : 'bg-indigo-600 text-white font-medium rounded-tr-none'
                  }`}>
                    <div className="whitespace-pre-line select-text">
                      {msg.text || (msg.isStreaming ? '...' : '')}
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-slate-800/40">
                      <span className={`text-[9px] ${isAi ? 'text-slate-500' : 'text-indigo-200'}`}>
                        {msg.time}
                      </span>

                      {isAi && msg.text && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedId === msg.id ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin text-cyan-400" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span>Gemini is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="pt-3 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask anything about hostel rules, mess menu, room availability, dues, complaints..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={chatLoading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={chatLoading || !inputMessage.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white transition-all disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: SMART COMPLAINT CLASSIFIER */}
      {activeTab === 'classifier' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                AI Complaint Analyzer & SLA Predictor
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter an issue description. Gemini AI will detect the technical category, assign risk priority, recommend staff, and predict resolution SLA.
              </p>
            </div>

            <form onSubmit={handleClassify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Title</label>
                <input
                  type="text"
                  value={classifyTitle}
                  onChange={(e) => setClassifyTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Description (Plain English) *</label>
                <textarea
                  rows={4}
                  required
                  value={classifyDesc}
                  onChange={(e) => setClassifyDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={classifyLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {classifyLoading ? 'Analyzing with Gemini AI...' : 'Analyze & Classify Issue'}
              </button>
            </form>
          </div>

          {/* Output Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                Gemini Analysis & Auto-Tags
              </h3>

              {classifyResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Detected Category</span>
                      <span className="text-sm font-bold text-indigo-400 capitalize mt-1 block">
                        {classifyResult.category}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Priority Level</span>
                      <span className={`text-sm font-bold capitalize mt-1 block flex items-center gap-1 ${
                        classifyResult.priority === 'urgent' ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {classifyResult.priority === 'urgent' && <Flame className="w-3.5 h-3.5 animate-pulse" />}
                        {classifyResult.priority}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Recommended Staff Assignee</span>
                    <span className="text-xs font-bold text-slate-200 mt-1 block">
                      👨‍🔧 {classifyResult.suggestedStaff}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Estimated Resolution SLA</span>
                    <span className="text-xs font-bold text-emerald-400 mt-1 block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Within {classifyResult.estimatedResolutionHours} Hours
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300 leading-relaxed">
                    <span className="font-bold block mb-1">AI Diagnostic Summary:</span>
                    {classifyResult.analysisSummary}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center rounded-xl bg-slate-950/60 border border-slate-800">
                  <Zap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Click "Analyze & Classify Issue" to see AI diagnosis.</p>
                </div>
              )}
            </div>

            {classifyResult && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Engine: Gemini 1.5 Flash</span>
                <span className="text-emerald-400 font-semibold">Confidence: {classifyResult.confidenceScore}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SMART RENT REMINDER COMPOSER (Admin Only) */}
      {activeTab === 'composer' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                AI Rent Reminder & Notice Composer
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Draft professional, personalized rent notices for WhatsApp, Email, or SMS with 1-click.
              </p>
            </div>

            <form onSubmit={handleComposeReminder} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Resident Name</label>
                  <input
                    type="text"
                    required
                    value={composerTenant}
                    onChange={(e) => setComposerTenant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Room #</label>
                  <input
                    type="text"
                    required
                    value={composerRoom}
                    onChange={(e) => setComposerRoom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pending Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={composerAmount}
                    onChange={(e) => setComposerAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Month</label>
                  <input
                    type="text"
                    required
                    value={composerMonth}
                    onChange={(e) => setComposerMonth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={composerDueDate}
                  onChange={(e) => setComposerDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={composerLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {composerLoading ? 'Drafting with Gemini AI...' : 'Generate Personalized Notice'}
              </button>
            </form>
          </div>

          {/* Generated Result */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  Generated Reminder Letter
                </h3>

                {composerResult && (
                  <button
                    onClick={() => copyToClipboard(composerResult.message)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLetter ? 'Copied!' : 'Copy Letter'}
                  </button>
                )}
              </div>

              {composerResult ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-mono">
                    {composerResult.message}
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                      📱 WhatsApp / SMS Text:
                    </span>
                    <p className="text-xs text-slate-300">{composerResult.smsText}</p>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center rounded-xl bg-slate-950/60 border border-slate-800">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Click "Generate Personalized Notice" to draft.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
