import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { userApi } from '../services'
import { useToast } from '../components/Toast'
import { cn } from '@/lib/utils'
import { 
  Swords, 
  Popcorn, 
  CheckCircle2, 
  ArrowRight,
  Trophy,
  PartyPopper,
  Sparkles
} from 'lucide-react'
import logo from '@/assets/logo.png'

/**
 * 角色选择引导页 - Redesigned
 * 提供高端、大气、情绪价值满满的选择体验
 */
export default function RoleGuidePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const refreshUser = useAuthStore((s) => s.refreshUser)

  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(null)

  const nextPath = searchParams.get('next') || '/'

  // Redirect if already selected
  useEffect(() => {
    if (user?.role_selected) {
      navigate(nextPath, { replace: true })
    }
  }, [user, nextPath, navigate])

  if (user?.role_selected) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">即将开启旅程...</p>
      </div>
    )
  }

  const handleSelectRole = async () => {
    if (!selectedRole) return

    setLoading(true)
    try {
      await userApi.selectRole(selectedRole)

      // 刷新用户信息确保数据同步
      await refreshUser()

      // Emotional feedback based on choice
      const feedback = selectedRole === 'contestant'
        ? { title: '勇士集结！', msg: '舞台已备好，请开始你的表演！' }
        : { title: '前排入座！', msg: '汽水瓜子已备好，尽情享受比赛！' }

      toast.success(feedback.msg)
      navigate(nextPath, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.detail || '选择失败，请重试'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const roles = [
    {
      id: 'contestant',
      icon: Swords,
      secondaryIcon: Trophy,
      title: '我是参赛者',
      tagline: '逐鹿群雄 · 问鼎巅峰',
      description: '代码是你的利剑，创意是你的盔甲。在这里展示你的才华，与其他顶尖开发者一决高下，赢取属于你的荣耀与大奖。',
      color: 'amber',
      gradient: 'from-amber-500/20 to-orange-500/20',
      activeGradient: 'from-amber-500 to-orange-600',
      textGradient: 'from-amber-600 to-orange-700',
      benefits: ['提交参赛作品', '争夺万元大奖', '获得专业评审', '提升技术影响力']
    },
    {
      id: 'spectator',
      icon: Popcorn,
      secondaryIcon: PartyPopper,
      title: '我是吃瓜群众',
      tagline: '指点江山 · 快乐围观',
      description: '不仅是旁观者，更是比赛气氛的制造者。参与投票、竞猜、互动，用你的眼光发现潜力股，见证王者的诞生。',
      color: 'emerald',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      activeGradient: 'from-emerald-500 to-teal-600',
      textGradient: 'from-emerald-600 to-teal-700',
      benefits: ['参与有奖竞猜', '每日签到福利', '为喜爱的作品投票', '轻松赢取积分周边']
    }
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 dark:bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-5xl z-10 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="relative inline-block group cursor-pointer">
             <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <img src={logo} alt="Logo" className="relative w-24 h-24 rounded-full shadow-2xl mx-auto transform transition-transform group-hover:scale-105" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              开启你的<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600"> 传奇之旅 </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              你好，<span className="font-semibold text-slate-900 dark:text-slate-200">{user?.display_name || user?.username}</span>。
              在这个充满无限可能的舞台上，你想扮演什么角色？
            </p>
          </div>
        </div>

        {/* Cards Container */}
        <div className="grid md:grid-cols-2 gap-8 px-4">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id
            const Icon = role.icon
            const SecondaryIcon = role.secondaryIcon

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                onMouseEnter={() => setIsHovered(role.id)}
                onMouseLeave={() => setIsHovered(null)}
                className={cn(
                  "relative group cursor-pointer rounded-3xl p-1 transition-all duration-500 ease-out transform",
                  isSelected ? "scale-[1.02] -translate-y-2" : "hover:scale-[1.01] hover:-translate-y-1",
                  "bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900",
                  "shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
                  isSelected ? `shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-2 ring-offset-4 dark:ring-offset-slate-950` : "hover:shadow-xl",
                  role.id === 'contestant' && isSelected && "ring-amber-500/50",
                  role.id === 'spectator' && isSelected && "ring-emerald-500/50"
                )}
              >
                {/* Border Gradient on Selection/Hover */}
                <div className={cn(
                  "absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 bg-gradient-to-br",
                  role.activeGradient,
                  (isSelected || isHovered === role.id) && "opacity-100"
                )} />

                {/* Inner Card Content */}
                <div className="relative h-full bg-white dark:bg-slate-900 rounded-[1.4rem] p-8 flex flex-col overflow-hidden">
                  
                  {/* Background Accents */}
                  <div className={cn(
                    "absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-10 transition-colors duration-500",
                    isSelected ? role.activeGradient : "bg-slate-200 dark:bg-slate-800"
                  )} />

                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                      "p-4 rounded-2xl transition-all duration-300",
                      isSelected ? `bg-gradient-to-br ${role.activeGradient} text-white shadow-lg` : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    )}>
                      <Icon size={32} strokeWidth={isSelected ? 2 : 1.5} />
                    </div>
                    {isSelected && (
                      <div className="animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className={cn("w-8 h-8", role.id === 'contestant' ? 'text-amber-500' : 'text-emerald-500')} />
                      </div>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <div className="space-y-2 mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{role.title}</h3>
                    <p className={cn(
                      "text-sm font-semibold tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r",
                      role.textGradient
                    )}>
                      {role.tagline}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                    {role.description}
                  </p>

                  {/* Benefits List - Only visible when hovered or selected for cleaner initial look, or always visible? Let's keep it minimal but visible */}
                  <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    {role.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <Sparkles className={cn("w-4 h-4 mr-2 opacity-0 -ml-6 transition-all duration-300", 
                          (isSelected || isHovered === role.id) ? "opacity-100 ml-0" : "",
                           role.id === 'contestant' ? 'text-amber-500' : 'text-emerald-500'
                        )} />
                        <span className={cn("transition-transform duration-300", (isSelected || isHovered === role.id) ? "translate-x-0" : "-translate-x-4")}>
                           {benefit}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Visual Decoration Icon (faded in bg) */}
                  <SecondaryIcon className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-50 dark:text-slate-800/50 transform rotate-12 -z-0 pointer-events-none" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center space-y-4 pb-8">
          <button
            onClick={handleSelectRole}
            disabled={!selectedRole || loading}
            className={cn(
              "group relative px-10 py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all duration-300 transform",
              selectedRole 
                ? "bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-105 hover:shadow-2xl" 
                : "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50",
              loading && "cursor-wait opacity-80"
            )}
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  正在确认身份...
                </>
              ) : (
                <>
                  确认身份，开启旅程
                  <ArrowRight className={cn("w-5 h-5 transition-transform duration-300", selectedRole ? "group-hover:translate-x-1" : "")} />
                </>
              )}
            </span>
          </button>
          
          <p className="text-sm text-slate-400 dark:text-slate-500 animate-pulse">
             {selectedRole ? '✨ 准备好迎接挑战了吗？' : '请点击上方卡片选择您的身份'}
          </p>
        </div>

      </div>
    </div>
  )
}