import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Bot, 
  Sparkles, 
  Send, 
  User, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Check, 
  MessageSquare, 
  Wrench, 
  FileText, 
  Flame, 
  Clock, 
  RefreshCw,
  UtensilsCrossed,
  Wifi,
  DoorOpen,
  DollarSign,
  HeartPulse,
  Package,
  Dumbbell,
  BookOpen
} from 'lucide-react';

export const AIAssistant = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'classifier' | 'composer'

  // Chat State
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${user?.name || 'Resident'}! 👋 I am your 24/7 PG Smart Assistant powered by Gemini. You can ask me anything about the hostel — like **"Where is the nearest hospital?"**, **"How do I connect to the WiFi?"**, today's meal schedule, gate closing curfew, laundry tokens, or rent dues!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Classifier State
  const [classifyTitle, setClassifyTitle] = useState('Bathroom geyser switch burning');
  const [classifyDesc, setClassifyDesc] = useState('The geyser power switch in Room 102 sparked with smoke and tripped the circuit breaker.');
  const [classifyResult, setClassifyResult] = useState(null);
  const [classifyLoading, setClassifyLoading] = useState(false);

  // Composer State (Admin)
  const [composerTenant, setComposerTenant] = useState('Rahul Sharma');
  const [composerRoom, setComposerRoom] = useState('102');
  const [composerAmount, setComposerAmount] = useState('7500');
  const [composerMonth, setComposerMonth] = useState('September 2026');
  const [composerResult, setComposerResult] = useState(null);
  const [composerLoading, setComposerLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setChatLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

      const res = await api.post('/ai/chat', { 
        message: textToSend,
        conversationHistory: history 
      });

      if (res.data?.success) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: res.data.reply,
            mode: res.data.mode,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: err.response?.data?.message || '⚠️ Unable to connect to assistant service. Please check network.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
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
    } catch (err) {
      alert('Classification failed');
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
        month: composerMonth
      });
      if (res.data?.success) {
        setComposerResult(res.data.data);
      }
    } catch (err) {
      alert('Composer failed');
    } finally {
      setComposerLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" /> Module 12 • Google Gemini AI Hub
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-cyan-400" />
            AI Intelligence & Resident Assistant
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            24/7 resident AI companion, nearest hospital lookups, WiFi setup guides, smart complaint triage, and rent notice drafter.
          </p>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { key: 'chat', label: '💬 Resident 24/7 AI Chatbot', icon: MessageSquare },
          { key: 'classifier', label: '⚡ Smart Complaint Auto-Classifier', icon: Zap },
          ...(isAdmin ? [{ key: 'composer', label: '✍️ Smart Rent Notice Composer', icon: FileText }] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: 24/7 AI CHATBOT */}
      {activeTab === 'chat' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col h-[670px]">
          {/* Quick Prompts Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-slate-800 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> Quick Ask:
            </span>
            {[
              { label: '🏥 Nearest Hospital & Pharmacy', prompt: "Give nearest hospital, doctor, and emergency medical help" },
              { label: '📶 Connect Hostel WiFi Steps', prompt: "Give steps to connect hostel wifi on my phone/laptop" },
              { label: '🍽️ Today’s 4-Meal Menu', prompt: "What is for dinner and snacks today?" },
              { label: '🚪 Gate Curfew Timings', prompt: "What are the hostel gate lockdown timings?" },
              { label: '📦 Courier & Parcel Policy', prompt: "How do parcel and courier deliveries work here?" },
              { label: '🏋️ Gym & 24/7 Study Room', prompt: "Where is the study room and what are the gym timings?" },
              { label: '💳 Check My Rent Dues', prompt: "Do I have any pending rent invoices?" },
              { label: '📞 Emergency Contacts', prompt: "Who is the warden and electrician contact?" }
            ].map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                className="px-3 py-1 rounded-full bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-medium border border-slate-800 whitespace-nowrap transition-colors flex items-center gap-1"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {messages.map((msg, index) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={index} className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isAi ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-indigo-600 text-white'
                  }`}>
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                    isAi
                      ? 'bg-slate-950 border border-slate-800 text-slate-200'
                      : 'bg-indigo-600 text-white font-medium rounded-tr-none'
                  }`}>
                    <div className="whitespace-pre-line">{msg.text}</div>
                    <span className={`block text-[9px] mt-2 ${isAi ? 'text-slate-500' : 'text-indigo-200'}`}>
                      {msg.time} {msg.mode && `• Powered by ${msg.mode}`}
                    </span>
                  </div>
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span>Gemini is generating response...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="pt-3 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything: nearest hospital, wifi connection steps, gate timings, dinner menu, rent..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !inputMessage.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white transition-all disabled:opacity-40"
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
                Enter an issue description in plain language. Gemini AI will automatically detect the technical category, assign risk priority, recommend technicians, and predict resolution SLA.
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
                <span>Model: Gemini 1.5 Flash</span>
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

              <button
                type="submit"
                disabled={composerLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {composerLoading ? 'Drafting with Gemini...' : 'Generate Personalized Notice'}
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
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Letter'}
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
                      📱 One-Line WhatsApp / SMS Text:
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