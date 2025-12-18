import { useState, useEffect } from 'react'
import {
  X,
  Package,
  Key,
  Copy,
  CheckCircle,
  Info,
  Shield,
  Gift,
  Backpack
} from 'lucide-react'
import { lotteryApi } from '../../services'
import {
  Heart,
  Coffee,
  Zap,
  Pizza,
  Star,
} from 'lucide-react'

// 道具图标映射
const itemIcons = {
  'cheer': Heart,
  'coffee': Coffee,
  'energy': Zap,
  'pizza': Pizza,
  'star': Star,
}

// 道具名称映射
const itemNames = {
  'cheer': '爱心打气',
  'coffee': '咖啡打气',
  'energy': '能量打气',
  'pizza': '披萨打气',
  'star': '星星打气',
}

export default function BackpackModal({ items, loading, onClose }) {
  const [activeTab, setActiveTab] = useState('items') // 'items' | 'apikeys'
  const [apiKeys, setApiKeys] = useState([])
  const [apiKeysLoading, setApiKeysLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  // 加载 API Keys
  useEffect(() => {
    const loadApiKeys = async () => {
      setApiKeysLoading(true)
      try {
        const keys = await lotteryApi.getApiKeys()
        setApiKeys(keys || [])
      } catch (error) {
        console.error('加载 API Key 失败:', error)
        setApiKeys([])
      } finally {
        setApiKeysLoading(false)
      }
    }
    loadApiKeys()
  }, [])

  // 复制兑换码
  const handleCopyCode = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 格式化时间
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 - 适配亮暗模式 */}
      <div
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* 弹窗内容 - 极简高端风格 (自适应) */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col shadow-2xl rounded-3xl">
        {/* 背景层 - 亮色为磨砂白，暗色为深空灰 */}
        <div className="absolute inset-0 bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5" />
        
        {/* 顶部光效装饰 - 亮色模式下减淡 */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-50" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/5 to-transparent rounded-t-3xl pointer-events-none" />

        {/* 头部区域 */}
        <div className="relative px-8 pt-8 pb-6 flex-shrink-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* 图标容器 - 模拟金属质感 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-md group-hover:bg-amber-500/30 transition-all duration-500" />
                <div className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-br from-white to-slate-100 dark:from-[#2a2d35] dark:to-[#1a1d21] rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                  <Backpack className="w-6 h-6 text-amber-500 dark:text-amber-500/90 drop-shadow-sm" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                  我的珍藏
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide uppercase">
                  MY INVENTORY
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="group p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* 标签页切换 - 极简线条风格 */}
          <div className="flex items-center gap-8 mt-8 border-b border-slate-200 dark:border-white/5">
            <button
              onClick={() => setActiveTab('items')}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeTab === 'items'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>道具</span>
                {totalItems > 0 && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-md border ${
                    activeTab === 'items' 
                      ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-500' 
                      : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                  }`}>
                    {totalItems}
                  </span>
                )}
              </div>
              {/* 底部激活条 */}
              {activeTab === 'items' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('apikeys')}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeTab === 'apikeys'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>API Keys</span>
                {apiKeys.length > 0 && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-md border ${
                    activeTab === 'apikeys' 
                      ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-500' 
                      : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                  }`}>
                    {apiKeys.length}
                  </span>
                )}
              </div>
              {/* 底部激活条 */}
              {activeTab === 'apikeys' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              )}
            </button>
          </div>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="relative flex-1 overflow-y-auto min-h-[300px] px-8 pb-8 z-10 custom-scrollbar">
          {activeTab === 'items' ? (
            // 道具列表
            <div className="space-y-6">
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse bg-slate-100 dark:bg-white/5 rounded-xl h-24" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-medium">暂无道具</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">参与活动赢取奖励</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {items.map((item) => {
                      const Icon = itemIcons[item.item_type] || Gift
                      const name = itemNames[item.item_type] || item.item_type
                      
                      return (
                        <div
                          key={item.item_type}
                          className="group relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-[#1a1d24] dark:to-[#141619] border border-slate-200 dark:border-white/5 hover:border-amber-500/30 dark:hover:border-amber-500/20 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-slate-50 dark:bg-black/40 rounded-lg border border-slate-100 dark:border-white/5 group-hover:border-amber-500/20 transition-colors">
                              <Icon className="w-5 h-5 text-slate-400 dark:text-slate-300 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" />
                            </div>
                            <span className="text-2xl font-bold text-slate-800 dark:text-white/90 font-mono tracking-tight">
                              x{item.quantity}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-white transition-colors">{name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">用于选手打气</p>
                          </div>
                          
                          {/* 装饰性背景光 */}
                          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* 提示信息 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                    <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    <p className="text-xs text-blue-600 dark:text-blue-300/80 leading-relaxed">
                      前往选手详情页，点击「为TA打气」即可使用道具支持你喜欢的选手。
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            // API Keys 列表
            <div className="space-y-4">
              {apiKeysLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse bg-slate-100 dark:bg-white/5 rounded-xl h-20" />
                  ))}
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Key className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-medium">暂无兑换码</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">去抽奖赢取专属 API Key</p>
                </div>
              ) : (
                <>
                  {apiKeys.map((key, index) => (
                    <div
                      key={key.id}
                      className="group relative bg-white dark:bg-[#14161a] border border-slate-200 dark:border-white/5 rounded-xl p-4 hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-all duration-300 shadow-sm dark:shadow-none"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            KEY #{String(index + 1).padStart(2, '0')}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            key.status === 'ASSIGNED' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-slate-400 dark:bg-slate-600'
                          }`} />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {formatDate(key.assigned_at)}
                        </span>
                      </div>
                      
                      {/* 代码区域 - 终端风格/卡片风格 */}
                      <div className="relative flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-slate-50 dark:bg-black/50 rounded-lg border border-slate-200 dark:border-white/5 px-3 py-2.5 font-mono text-sm text-slate-700 dark:text-amber-500/90 break-all select-all shadow-inner group-hover:border-amber-500/20 dark:group-hover:border-amber-500/10 transition-colors">
                          {key.code}
                        </div>
                        <button
                          onClick={() => handleCopyCode(key.code, key.id)}
                          className={`flex-shrink-0 p-2.5 rounded-lg border transition-all duration-200 ${
                            copiedId === key.id
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500'
                              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white'
                          }`}
                        >
                          {copiedId === key.id ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                        <Shield className="w-3 h-3" />
                        <span>一次性凭证，请勿泄露给他人</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 flex items-center gap-3">
                    <Info className="w-4 h-4 text-amber-500/70 dark:text-amber-500/50" />
                    <p className="text-xs text-amber-600/80 dark:text-amber-500/70">
                      兑换码可用于平台 API 调用额度充值，长期有效。
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 底部 - 装饰性 */}
        <div className="relative px-8 py-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0F1115]">
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-600">
             <span>SECURE STORAGE</span>
             <span>CHICKEN KING CONTEST</span>
          </div>
        </div>
      </div>
      
      {/* 滚动条样式注入 */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3); /* slate-400/30 for light mode */
          border-radius: 2px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}