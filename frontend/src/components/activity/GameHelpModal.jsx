/**
 * 游戏玩法帮助弹窗组件
 */
import { X, HelpCircle } from 'lucide-react'

export default function GameHelpModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-[scaleIn_0.2s_ease-out]">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-500 to-pink-500">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
          >
            我知道了
          </button>
        </div>
      </div>
      <style>{`@keyframes scaleIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  )
}

/**
 * 帮助按钮组件
 */
export function HelpButton({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group ${className}`}
      title="查看玩法说明"
    >
      <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
    </button>
  )
}
