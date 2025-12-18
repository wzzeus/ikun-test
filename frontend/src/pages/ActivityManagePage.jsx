import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import {
  Settings,
  Coins,
  Gift,
  Ticket,
  Sparkles,
  Target,
  Package,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Save,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Zap,
  ArrowLeft,
  ShoppingBag,
  Dice1,
  Dice5,
  Star,
  Percent,
  Key,
  Award,
  Ban,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CircleDot,
  Cherry,
  Crown,
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../components/Toast'
import { adminApi2 } from '../services'

// Tab 组件
function Tab({ active, onClick, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
        active
          ? 'text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-md shadow-purple-500/20'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

// 统计卡片
function StatCard({ title, value, subtitle, icon: Icon, color = 'purple' }) {
  const colorMap = {
    purple: { bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-200/50 dark:border-purple-500/20', icon: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
    pink: { bg: 'from-pink-500/10 to-pink-600/5', border: 'border-pink-200/50 dark:border-pink-500/20', icon: 'from-pink-500 to-pink-600', shadow: 'shadow-pink-500/20' },
    blue: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-200/50 dark:border-blue-500/20', icon: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    green: { bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-200/50 dark:border-emerald-500/20', icon: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    orange: { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-200/50 dark:border-orange-500/20', icon: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20' },
    cyan: { bg: 'from-cyan-500/10 to-cyan-600/5', border: 'border-cyan-200/50 dark:border-cyan-500/20', icon: 'from-cyan-500 to-cyan-600', shadow: 'shadow-cyan-500/20' },
  }
  const theme = colorMap[color] || colorMap.purple

  return (
    <div className={`relative overflow-hidden bg-white dark:bg-slate-900/50 rounded-2xl border ${theme.border} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${theme.shadow} group backdrop-blur-sm`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-50`} />
      <div className="relative flex items-center justify-between z-10">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3.5 rounded-xl bg-gradient-to-br ${theme.icon} shadow-lg ${theme.shadow} transform transition-transform group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

// 活动概览面板
function OverviewPanel() {
  const toast = useToast()
  const [viewMode, setViewMode] = useState('total') // 'total' | 'daily'
  const [stats, setStats] = useState(null)
  const [dailyStats, setDailyStats] = useState(null)
  const [rangeStats, setRangeStats] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [chartDays, setChartDays] = useState(7) // 图表显示天数
  const [loading, setLoading] = useState(true)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    loadStats()
    loadRangeStats(7)
  }, [])

  useEffect(() => {
    if (viewMode === 'daily') {
      loadDailyStats(selectedDate)
    }
  }, [viewMode, selectedDate])

  const loadStats = async () => {
    try {
      const data = await adminApi2.getActivityStats()
      setStats(data)
    } catch (error) {
      console.error('加载统计失败:', error)
      setStats({
        total_points_issued: 0,
        total_points_spent: 0,
        total_signins: 0,
        total_lottery_draws: 0,
        total_scratch_cards: 0,
        total_gacha_draws: 0,
        total_slot_plays: 0,
        total_exchanges: 0,
        active_users_today: 0,
        points_issued_today: 0,
        points_spent_today: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDailyStats = async (date) => {
    setDailyLoading(true)
    try {
      const data = await adminApi2.getDailyStats(date)
      setDailyStats(data)
    } catch (error) {
      console.error('加载每日统计失败:', error)
      toast.error('加载每日统计失败')
    } finally {
      setDailyLoading(false)
    }
  }

  const loadRangeStats = async (days) => {
    setChartLoading(true)
    try {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - days + 1)
      const data = await adminApi2.getRangeStats(
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      )
      setRangeStats(data)
    } catch (error) {
      console.error('加载趋势数据失败:', error)
    } finally {
      setChartLoading(false)
    }
  }

  const handleChartDaysChange = (days) => {
    setChartDays(days)
    loadRangeStats(days)
  }

  const changeDate = (days) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    const today = new Date()
    if (date <= today) {
      setSelectedDate(date.toISOString().split('T')[0])
    }
  }

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split('T')[0]) {
      return '今天'
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return '昨天'
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  // 积分趋势图表配置
  const pointsChartOption = useMemo(() => {
    if (!rangeStats?.days) return {}
    const days = rangeStats.days
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#999' }
        }
      },
      legend: {
        data: ['发放积分', '消耗积分', '净流入'],
        textStyle: { color: '#94a3b8' },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: days.map(d => {
          const date = new Date(d.date)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }),
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.3)' } }
      },
      series: [
        {
          name: '发放积分',
          type: 'bar',
          data: days.map(d => d.points_issued),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#059669' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '消耗积分',
          type: 'bar',
          data: days.map(d => d.points_spent),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#f97316' },
                { offset: 1, color: '#ea580c' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '净流入',
          type: 'line',
          data: days.map(d => d.points_issued - d.points_spent),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#8b5cf6' },
                { offset: 1, color: '#a855f7' }
              ]
            }
          },
          itemStyle: { color: '#8b5cf6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0)' }
              ]
            }
          }
        }
      ]
    }
  }, [rangeStats])

  // 活动参与趋势图表配置
  const activityChartOption = useMemo(() => {
    if (!rangeStats?.days) return {}
    const days = rangeStats.days
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(236, 72, 153, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' }
      },
      legend: {
        data: ['签到', '抽奖', '刮刮乐', '兑换'],
        textStyle: { color: '#94a3b8' },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: days.map(d => {
          const date = new Date(d.date)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }),
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.3)' } }
      },
      series: [
        {
          name: '签到',
          type: 'line',
          data: days.map(d => d.signins),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#06b6d4' },
          itemStyle: { color: '#06b6d4' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(6, 182, 212, 0.2)' },
                { offset: 1, color: 'rgba(6, 182, 212, 0)' }
              ]
            }
          }
        },
        {
          name: '抽奖',
          type: 'line',
          data: days.map(d => d.lottery_draws),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#ec4899' },
          itemStyle: { color: '#ec4899' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(236, 72, 153, 0.2)' },
                { offset: 1, color: 'rgba(236, 72, 153, 0)' }
              ]
            }
          }
        },
        {
          name: '刮刮乐',
          type: 'line',
          data: days.map(d => d.scratch_cards),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#f97316' },
          itemStyle: { color: '#f97316' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(249, 115, 22, 0.2)' },
                { offset: 1, color: 'rgba(249, 115, 22, 0)' }
              ]
            }
          }
        },
        {
          name: '兑换',
          type: 'line',
          data: days.map(d => d.exchanges),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0)' }
              ]
            }
          }
        }
      ]
    }
  }, [rangeStats])

  // 活跃用户趋势图表配置
  const userChartOption = useMemo(() => {
    if (!rangeStats?.days) return {}
    const days = rangeStats.days
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: days.map(d => {
          const date = new Date(d.date)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }),
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.3)' } }
      },
      series: [
        {
          name: '活跃用户',
          type: 'line',
          data: days.map(d => d.active_users),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#3b82f6' },
                { offset: 0.5, color: '#8b5cf6' },
                { offset: 1, color: '#ec4899' }
              ]
            }
          },
          itemStyle: {
            color: '#8b5cf6',
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.4)' },
                { offset: 0.5, color: 'rgba(139, 92, 246, 0.1)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0)' }
              ]
            }
          }
        }
      ]
    }
  }, [rangeStats])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 视图切换 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('total')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'total'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1.5" />
            全部统计
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-1.5" />
            每日统计
          </button>
        </div>

        {viewMode === 'daily' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
              />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {formatDateDisplay(selectedDate)}
              </span>
            </div>
            <button
              onClick={() => changeDate(1)}
              disabled={isToday}
              className={`p-2 rounded-lg transition-colors ${
                isToday
                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <button
          onClick={() => {
            if (viewMode === 'total') {
              loadStats()
              loadRangeStats(chartDays)
            } else {
              loadDailyStats(selectedDate)
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || dailyLoading || chartLoading) ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {viewMode === 'total' ? (
        <>
          {/* 积分总览 - 全部统计 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              积分总览
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="累计发放积分"
                value={stats?.total_points_issued?.toLocaleString() || 0}
                subtitle={`今日 +${stats?.points_issued_today?.toLocaleString() || 0}`}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title="累计消耗积分"
                value={stats?.total_points_spent?.toLocaleString() || 0}
                subtitle={`今日 -${stats?.points_spent_today?.toLocaleString() || 0}`}
                icon={Zap}
                color="orange"
              />
              <StatCard
                title="流通积分"
                value={((stats?.total_points_issued || 0) - (stats?.total_points_spent || 0)).toLocaleString()}
                icon={Coins}
                color="purple"
              />
              <StatCard
                title="今日活跃用户"
                value={stats?.active_users_today || 0}
                icon={Users}
                color="blue"
              />
            </div>
          </div>

          {/* 积分趋势图表 */}
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                积分趋势
              </h3>
              <div className="flex items-center gap-2">
                {[7, 14, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => handleChartDaysChange(days)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      chartDays === days
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {days}天
                  </button>
                ))}
              </div>
            </div>
            {chartLoading ? (
              <div className="h-80 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : rangeStats?.days?.length > 0 ? (
              <ReactECharts option={pointsChartOption} style={{ height: '320px' }} />
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">暂无数据</div>
            )}
          </div>

          {/* 活动参与统计 - 全部统计 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              活动参与统计（累计）
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="签到次数"
                value={stats?.total_signins?.toLocaleString() || 0}
                icon={Calendar}
                color="cyan"
              />
              <StatCard
                title="抽奖次数"
                value={stats?.total_lottery_draws?.toLocaleString() || 0}
                icon={Gift}
                color="pink"
              />
              <StatCard
                title="刮刮乐次数"
                value={stats?.total_scratch_cards?.toLocaleString() || 0}
                icon={Ticket}
                color="orange"
              />
              <StatCard
                title="扭蛋机次数"
                value={stats?.total_gacha_draws?.toLocaleString() || 0}
                icon={Sparkles}
                color="purple"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <StatCard
                title="老虎机次数"
                value={stats?.total_slot_plays?.toLocaleString() || 0}
                icon={Dice1}
                color="green"
              />
              <StatCard
                title="兑换次数"
                value={stats?.total_exchanges?.toLocaleString() || 0}
                icon={ShoppingBag}
                color="blue"
              />
            </div>
          </div>

          {/* 活动参与趋势图表 */}
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              活动参与趋势
            </h3>
            {chartLoading ? (
              <div className="h-80 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : rangeStats?.days?.length > 0 ? (
              <ReactECharts option={activityChartOption} style={{ height: '320px' }} />
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">暂无数据</div>
            )}
          </div>

          {/* 活跃用户趋势图表 */}
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              活跃用户趋势
            </h3>
            {chartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : rangeStats?.days?.length > 0 ? (
              <ReactECharts option={userChartOption} style={{ height: '260px' }} />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">暂无数据</div>
            )}
          </div>
        </>
      ) : (
        <>
          {dailyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : dailyStats ? (
            <>
              {/* 积分总览 - 每日统计 */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  {formatDateDisplay(selectedDate)} 积分统计
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="发放积分"
                    value={dailyStats.points_issued?.toLocaleString() || 0}
                    icon={TrendingUp}
                    color="green"
                  />
                  <StatCard
                    title="消耗积分"
                    value={dailyStats.points_spent?.toLocaleString() || 0}
                    icon={Zap}
                    color="orange"
                  />
                  <StatCard
                    title="净流入"
                    value={((dailyStats.points_issued || 0) - (dailyStats.points_spent || 0)).toLocaleString()}
                    icon={Coins}
                    color="purple"
                  />
                  <StatCard
                    title="活跃用户"
                    value={dailyStats.active_users || 0}
                    icon={Users}
                    color="blue"
                  />
                </div>
              </div>

              {/* 活动参与统计 - 每日统计 */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-pink-500" />
                  {formatDateDisplay(selectedDate)} 活动参与
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="签到人数"
                    value={dailyStats.signins?.toLocaleString() || 0}
                    icon={Calendar}
                    color="cyan"
                  />
                  <StatCard
                    title="抽奖次数"
                    value={dailyStats.lottery_draws?.toLocaleString() || 0}
                    icon={Gift}
                    color="pink"
                  />
                  <StatCard
                    title="刮刮乐次数"
                    value={dailyStats.scratch_cards?.toLocaleString() || 0}
                    icon={Ticket}
                    color="orange"
                  />
                  <StatCard
                    title="扭蛋机次数"
                    value={dailyStats.gacha_draws?.toLocaleString() || 0}
                    icon={Sparkles}
                    color="purple"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <StatCard
                    title="老虎机次数"
                    value={dailyStats.slot_plays?.toLocaleString() || 0}
                    icon={Dice1}
                    color="green"
                  />
                  <StatCard
                    title="兑换次数"
                    value={dailyStats.exchanges?.toLocaleString() || 0}
                    icon={ShoppingBag}
                    color="blue"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">暂无数据</div>
          )}
        </>
      )}
    </div>
  )
}

// 签到配置面板
function SigninConfigPanel() {
  const toast = useToast()
  const [config, setConfig] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [newMilestone, setNewMilestone] = useState({ days: '', bonus: '' })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const data = await adminApi2.getSigninConfig()
      // API 返回 {base_points: ..., milestones: [...]} 格式
      setConfig({
        base_points: data.base_points || 100,
        streak_bonus: 2,
        max_streak_bonus: 20,
      })
      setMilestones(data.milestones || [])
    } catch (error) {
      console.error('加载签到配置失败:', error)
      toast.error('加载签到配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMilestone = async () => {
    if (!newMilestone.days || !newMilestone.bonus) {
      toast.error('请填写完整信息')
      return
    }
    try {
      await adminApi2.createMilestone({
        days: parseInt(newMilestone.days),
        bonus_points: parseInt(newMilestone.bonus),
      })
      toast.success('里程碑添加成功')
      setNewMilestone({ days: '', bonus: '' })
      loadConfig()
    } catch (error) {
      toast.error('添加失败：' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDeleteMilestone = async (id) => {
    if (!confirm('确定删除这个里程碑？')) return
    try {
      await adminApi2.deleteMilestone(id)
      toast.success('删除成功')
      loadConfig()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-purple-500" /></div>
  }

  return (
    <div className="space-y-6">
      {/* 基础配置 */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-500" />
          基础配置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">基础签到积分</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{config?.base_points || 10}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">连续签到加成</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{config?.streak_bonus || 2} 积分/天</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">最大连续加成</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{config?.max_streak_bonus || 20} 积分</p>
          </div>
        </div>
      </div>

      {/* 里程碑奖励 */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          里程碑奖励
        </h3>

        {/* 添加新里程碑 */}
        <div className="flex gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <input
            type="number"
            placeholder="连续天数"
            value={newMilestone.days}
            onChange={(e) => setNewMilestone({ ...newMilestone, days: e.target.value })}
            className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
          />
          <input
            type="number"
            placeholder="奖励积分"
            value={newMilestone.bonus}
            onChange={(e) => setNewMilestone({ ...newMilestone, bonus: e.target.value })}
            className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
          />
          <button
            onClick={handleAddMilestone}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加
          </button>
        </div>

        {/* 里程碑列表 */}
        <div className="space-y-2">
          {milestones.sort((a, b) => (a.day || a.days) - (b.day || b.days)).map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {m.day || m.days}
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">连续签到 {m.day || m.days} 天</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">奖励 {m.bonus_points} 积分</p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteMilestone(m.id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {milestones.length === 0 && (
            <p className="text-center text-slate-400 dark:text-slate-500 py-8">暂无里程碑配置</p>
          )}
        </div>
      </div>
    </div>
  )
}

// 抽奖配置面板
function LotteryConfigPanel() {
  const toast = useToast()
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPrize, setEditingPrize] = useState(null)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const data = await adminApi2.getLotteryConfigs()
      // API 返回 {items: [...]} 格式
      setConfigs(data.items || data || [])
    } catch (error) {
      console.error('加载抽奖配置失败:', error)
      toast.error('加载抽奖配置失败')
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateConfig = async (id, updates) => {
    try {
      await adminApi2.updateLotteryConfig(id, updates)
      toast.success('更新成功')
      loadConfigs()
    } catch (error) {
      toast.error('更新失败：' + (error.response?.data?.detail || error.message))
    }
  }

  const handleUpdatePrize = async (id, updates) => {
    try {
      await adminApi2.updatePrize(id, updates)
      toast.success('更新成功')
      setEditingPrize(null)
      loadConfigs()
    } catch (error) {
      toast.error('更新失败：' + (error.response?.data?.detail || error.message))
    }
  }

  const PRIZE_TYPE_MAP = {
    POINTS: '积分',
    ITEM: '道具',
    API_KEY: 'API Key',
    NOTHING: '谢谢参与',
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-purple-500" /></div>
  }

  // 确保 configs 是数组
  const configList = Array.isArray(configs) ? configs : []

  return (
    <div className="space-y-6">
      {configList.length === 0 && (
        <div className="text-center py-12 text-slate-400">暂无抽奖配置</div>
      )}
      {configList.map((config) => (
        <div key={config.id} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              {config.name}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              config.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {config.is_active ? '已启用' : '已禁用'}
            </span>
          </div>

          {/* 基础配置 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">消耗积分</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{config.cost_points}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">每日限制</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{config.daily_limit || '无限制'}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">总抽奖次数</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{config.total_draws || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">奖品种类</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{config.prizes?.length || 0}</p>
            </div>
          </div>

          {/* 奖品列表 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">奖品池（点击编辑按钮修改权重控制概率）</p>
            {config.prizes?.map((prize) => {
              const totalWeight = config.prizes?.reduce((sum, p) => sum + (p.weight || 0), 0) || 1
              const probability = ((prize.weight / totalWeight) * 100).toFixed(1)
              return (
                <div key={prize.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      prize.is_rare ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      {prize.is_rare ? <Star className="w-5 h-5 text-white" /> : <Gift className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{prize.prize_name || prize.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {PRIZE_TYPE_MAP[prize.prize_type] || prize.prize_type || prize.type} | 权重: {prize.weight} | 概率: {probability}% | 库存: {prize.stock ?? '无限'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingPrize === prize.id ? (
                      <>
                        <input
                          type="number"
                          defaultValue={prize.weight}
                          min="1"
                          className="w-20 px-2 py-1 text-sm rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                          id={`weight-${prize.id}`}
                        />
                        <button
                          onClick={() => handleUpdatePrize(prize.id, { weight: parseInt(document.getElementById(`weight-${prize.id}`).value) || 1 })}
                          className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          title="保存"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingPrize(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="取消"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditingPrize(prize.id)}
                        className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                        title="编辑权重"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// 兑换商城管理面板
function ExchangeManagePanel() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const data = await adminApi2.getExchangeItemsAdmin()
      setItems(data.items || data || [])
    } catch (error) {
      console.error('加载商品失败:', error)
      toast.error('加载商品失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item.id)
    setEditForm({
      price: item.price,
      stock: item.stock,
      daily_limit: item.daily_limit,
      total_limit: item.total_limit,
      is_active: item.is_active,
    })
  }

  const handleSave = async (id) => {
    try {
      await adminApi2.updateExchangeItem(id, editForm)
      toast.success('更新成功')
      setEditingItem(null)
      loadItems()
    } catch (error) {
      toast.error('更新失败：' + (error.response?.data?.detail || error.message))
    }
  }

  const ITEM_TYPE_MAP = {
    LOTTERY_TICKET: { name: '抽奖券', icon: Gift, color: 'pink' },
    SCRATCH_TICKET: { name: '刮刮乐券', icon: Ticket, color: 'orange' },
    GACHA_TICKET: { name: '扭蛋券', icon: Sparkles, color: 'purple' },
    API_KEY: { name: 'API Key', icon: Zap, color: 'blue' },
    ITEM: { name: '道具', icon: Package, color: 'green' },
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-purple-500" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-blue-500" />
          兑换商品管理
        </h3>
      </div>

      <div className="grid gap-4">
        {items.map((item) => {
          const typeInfo = ITEM_TYPE_MAP[item.item_type] || { name: item.item_type, icon: Package, color: 'slate' }
          const TypeIcon = typeInfo.icon
          const isEditing = editingItem === item.id

          return (
            <div key={item.id} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${typeInfo.color}-400 to-${typeInfo.color}-600 flex items-center justify-center`}>
                    <TypeIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-800 dark:text-white">{item.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {item.is_active ? '上架' : '下架'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{typeInfo.name}</p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSave(item.id)}
                      className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setEditingItem(null)}
                      className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">价格</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    />
                  ) : (
                    <p className="font-bold text-yellow-600 dark:text-yellow-400">{item.price} 积分</p>
                  )}
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">库存</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.stock || ''}
                      onChange={(e) => setEditForm({ ...editForm, stock: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="无限"
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    />
                  ) : (
                    <p className="font-bold text-slate-800 dark:text-white">{item.stock ?? '无限'}</p>
                  )}
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">每日限购</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.daily_limit || ''}
                      onChange={(e) => setEditForm({ ...editForm, daily_limit: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="无限"
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    />
                  ) : (
                    <p className="font-bold text-slate-800 dark:text-white">{item.daily_limit || '无限'}</p>
                  )}
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">总限购</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.total_limit || ''}
                      onChange={(e) => setEditForm({ ...editForm, total_limit: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="无限"
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    />
                  ) : (
                    <p className="font-bold text-slate-800 dark:text-white">{item.total_limit || '无限'}</p>
                  )}
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">已兑换</p>
                  <p className="font-bold text-slate-800 dark:text-white">{item.exchange_count || 0}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 用户积分调整面板
function UserPointsPanel() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [adjustingUser, setAdjustingUser] = useState(null)
  const [adjustForm, setAdjustForm] = useState({ amount: '', reason: '' })

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return
    setLoading(true)
    try {
      const data = await adminApi2.getUsers({ search: searchKeyword, limit: 20 })
      setUsers(data.items || [])
    } catch (error) {
      console.error('搜索用户失败:', error)
      toast.error('搜索失败：' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleAdjust = async (userId) => {
    if (!adjustForm.amount || !adjustForm.reason) {
      toast.error('请填写完整信息')
      return
    }
    try {
      await adminApi2.adjustPoints(userId, {
        amount: parseInt(adjustForm.amount),
        reason: adjustForm.reason,
      })
      toast.success('积分调整成功')
      setAdjustingUser(null)
      setAdjustForm({ amount: '', reason: '' })
      handleSearch()
    } catch (error) {
      toast.error('调整失败：' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <div className="space-y-6">
      {/* 搜索 */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          用户积分调整
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索用户名或ID..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            搜索
          </button>
        </div>
      </div>

      {/* 用户列表 */}
      {users.length > 0 && (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{user.display_name || user.username}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username} | 积分: {user.balance ?? user.points_balance ?? 0}</p>
                  </div>
                </div>

                {adjustingUser === user.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="积分数量(+/-)"
                      value={adjustForm.amount}
                      onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                      className="w-28 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    />
                    <input
                      type="text"
                      placeholder="调整原因"
                      value={adjustForm.reason}
                      onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                      className="w-40 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    />
                    <button
                      onClick={() => handleAdjust(user.id)}
                      className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => { setAdjustingUser(null); setAdjustForm({ amount: '', reason: '' }) }}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAdjustingUser(user.id)}
                    className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  >
                    调整积分
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 刮刮乐/彩票管理面板
function ScratchManagePanel() {
  const toast = useToast()
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPrize, setEditingPrize] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCreateConfig, setShowCreateConfig] = useState(false)
  const [newConfig, setNewConfig] = useState({
    name: '刮刮乐活动',
    cost_points: 30,
    daily_limit: 10,
  })
  const [newPrize, setNewPrize] = useState({
    prize_name: '',
    prize_type: 'POINTS',
    prize_value: '',
    weight: 100,
    stock: null,
    is_rare: false,
  })

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const data = await adminApi2.getLotteryConfigs()
      // 筛选刮刮乐配置
      const scratchConfigs = (data.items || data || []).filter(
        c => c.name?.includes('刮刮乐') || c.name?.includes('彩票')
      )
      setConfigs(scratchConfigs)
    } catch (error) {
      console.error('加载刮刮乐配置失败:', error)
      toast.error('加载配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConfig = async () => {
    if (!newConfig.name) {
      toast.error('请填写配置名称')
      return
    }
    try {
      await adminApi2.createLotteryConfig(newConfig)
      toast.success('创建成功')
      setShowCreateConfig(false)
      setNewConfig({ name: '刮刮乐活动', cost_points: 30, daily_limit: 10 })
      loadConfigs()
    } catch (error) {
      toast.error('创建失败：' + (error.response?.data?.detail || error.message))
    }
  }

  const handleUpdateConfig = async (id, updates) => {
    try {
      await adminApi2.updateLotteryConfig(id, updates)
      toast.success('更新成功')
      loadConfigs()
    } catch (error) {
      toast.error('更新失败：' + (error.response?.data?.detail || error.message))
    }
  }

  const handleAddPrize = async (configId) => {
    if (!newPrize.prize_name) {
      toast.error('请填写奖品名称')
      return
    }
    try {
      await adminApi2.createPrize({
        config_id: configId,
        ...newPrize,
        stock: newPrize.stock || null,
      })
      toast.success('奖品添加成功')
      setNewPrize({
        prize_name: '',
        prize_type: 'POINTS',
        prize_value: '',
        weight: 100,
        stock: null,
        is_rare: false,
      })
      setShowCreateForm(false)
      loadConfigs()
    } catch (error) {
      toast.error('添加失败：' + (error.response?.data?.detail || error.message))
    }
  }

  const handleUpdatePrize = async (id, updates) => {
    try {
      await adminApi2.updatePrize(id, updates)
      toast.success('更新成功')
      setEditingPrize(null)
      loadConfigs()
    } catch (error) {
      toast.error('更新失败：' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDeletePrize = async (id) => {
    if (!confirm('确定删除这个奖品？')) return
    try {
      await adminApi2.deletePrize(id)
      toast.success('删除成功')
      loadConfigs()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const PRIZE_TYPE_MAP = {
    POINTS: { name: '积分', icon: Coins, color: 'yellow' },
    ITEM: { name: '道具', icon: Package, color: 'blue' },
    API_KEY: { name: 'API Key', icon: Key, color: 'green' },
    EMPTY: { name: '谢谢参与', icon: X, color: 'gray' },
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-orange-500" /></div>
  }

  return (
    <div className="space-y-6">
      {/* 页面说明 */}
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">刮刮乐/彩票管理</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">管理刮刮乐奖品和概率配置</p>
          </div>
        </div>
      </div>

      {/* 创建配置按钮 */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateConfig(!showCreateConfig)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          创建刮刮乐配置
        </button>
      </div>

      {/* 创建配置表单 */}
      {showCreateConfig && (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-orange-200 dark:border-orange-800/30 p-6">
          <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-orange-500" />
            创建刮刮乐配置
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">配置名称 *</label>
              <input
                type="text"
                value={newConfig.name}
                onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                placeholder="如：刮刮乐活动、彩票抽奖"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
              <p className="text-xs text-slate-400 mt-1">名称需包含"刮刮乐"或"彩票"</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">消耗积分</label>
              <input
                type="number"
                value={newConfig.cost_points}
                onChange={(e) => setNewConfig({ ...newConfig, cost_points: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">每日限制</label>
              <input
                type="number"
                value={newConfig.daily_limit || ''}
                onChange={(e) => setNewConfig({ ...newConfig, daily_limit: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="空为无限制"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowCreateConfig(false)}
              className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleCreateConfig}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              创建配置
            </button>
          </div>
        </div>
      )}

      {configs.length === 0 && !showCreateConfig ? (
        <div className="text-center py-12 text-slate-400">
          <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>暂无刮刮乐配置</p>
          <p className="text-sm mt-2">点击上方按钮创建刮刮乐配置</p>
        </div>
      ) : (
        configs.map((config) => (
          <div key={config.id} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-500" />
                {config.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  config.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {config.is_active ? '已启用' : '已禁用'}
                </span>
                <button
                  onClick={() => handleUpdateConfig(config.id, { is_active: !config.is_active })}
                  className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"
                >
                  {config.is_active ? '禁用' : '启用'}
                </button>
              </div>
            </div>

            {/* 基础配置 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">消耗积分</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{config.cost_points}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">每日限制</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{config.daily_limit || '无限制'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">总抽奖次数</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{config.total_draws || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">奖品种类</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{config.prizes?.length || 0}</p>
              </div>
            </div>

            {/* 添加奖品按钮 */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowCreateForm(showCreateForm === config.id ? false : config.id)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                添加奖品
              </button>
            </div>

            {/* 创建奖品表单 */}
            {showCreateForm === config.id && (
              <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800/30">
                <h4 className="font-medium text-slate-800 dark:text-white mb-3">添加新奖品</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="奖品名称 *"
                    value={newPrize.prize_name}
                    onChange={(e) => setNewPrize({ ...newPrize, prize_name: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                  <select
                    value={newPrize.prize_type}
                    onChange={(e) => setNewPrize({ ...newPrize, prize_type: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  >
                    <option value="POINTS">积分</option>
                    <option value="ITEM">道具</option>
                    <option value="API_KEY">API Key</option>
                    <option value="EMPTY">谢谢参与</option>
                  </select>
                  <input
                    type="text"
                    placeholder="奖品值（积分数/道具名）"
                    value={newPrize.prize_value}
                    onChange={(e) => setNewPrize({ ...newPrize, prize_value: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="权重"
                    value={newPrize.weight}
                    onChange={(e) => setNewPrize({ ...newPrize, weight: parseInt(e.target.value) || 100 })}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="库存（空=无限）"
                    value={newPrize.stock || ''}
                    onChange={(e) => setNewPrize({ ...newPrize, stock: e.target.value ? parseInt(e.target.value) : null })}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                  <label className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={newPrize.is_rare}
                      onChange={(e) => setNewPrize({ ...newPrize, is_rare: e.target.checked })}
                      className="w-4 h-4 rounded text-orange-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">稀有奖品</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleAddPrize(config.id)}
                    className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    添加
                  </button>
                </div>
              </div>
            )}

            {/* 奖品列表 */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">奖品池（点击编辑按钮修改权重控制概率）</p>
              {config.prizes?.map((prize) => {
                const typeInfo = PRIZE_TYPE_MAP[prize.prize_type] || PRIZE_TYPE_MAP.EMPTY
                const TypeIcon = typeInfo.icon
                const totalWeight = config.prizes?.reduce((sum, p) => sum + (p.weight || 0), 0) || 1
                const probability = ((prize.weight / totalWeight) * 100).toFixed(1)
                return (
                  <div key={prize.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        prize.is_rare ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                        {prize.is_rare ? <Star className="w-5 h-5 text-white" /> : <TypeIcon className="w-5 h-5 text-slate-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{prize.prize_name || prize.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {typeInfo.name} | 权重: {prize.weight} | 概率: {probability}% | 库存: {prize.stock ?? '无限'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingPrize === prize.id ? (
                        <>
                          <input
                            type="number"
                            defaultValue={prize.weight}
                            min="1"
                            className="w-20 px-2 py-1 text-sm rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                            id={`scratch-weight-${prize.id}`}
                          />
                          <button
                            onClick={() => handleUpdatePrize(prize.id, { weight: parseInt(document.getElementById(`scratch-weight-${prize.id}`).value) || 1 })}
                            className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                            title="保存"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingPrize(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            title="取消"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingPrize(prize.id)}
                            className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"
                            title="编辑权重"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePrize(prize.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// 老虎机管理面板 - 真正的符号和权重配置
function SlotMachineManagePanel() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState(null)
  const [symbols, setSymbols] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [stats, setStats] = useState(null)

  // 加载配置
  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi2.getSlotMachineConfig()
      setConfig(data.config || null)
      setSymbols(data.symbols || [])
      setMetrics(data.metrics || null)
    } catch (e) {
      console.error('加载老虎机配置失败:', e)
      toast.error(e?.response?.data?.detail || '加载配置失败')
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 加载统计
  const loadStats = useCallback(async () => {
    try {
      const data = await adminApi2.getSlotMachineStats(7)
      setStats(data)
    } catch (e) {
      console.error('加载统计失败:', e)
    }
  }, [])

  useEffect(() => {
    loadConfig()
    loadStats()
  }, [loadConfig, loadStats])

  // 添加符号
  const addSymbol = () => {
    setSymbols((prev) => [
      ...prev,
      {
        symbol_key: `symbol_${Date.now()}`,
        emoji: '🎰',
        name: '新符号',
        multiplier: 1,
        weight: 5,
        sort_order: (prev[prev.length - 1]?.sort_order || 0) + 10,
        is_enabled: true,
        is_jackpot: false,
      },
    ])
  }

  // 删除符号
  const removeSymbol = (idx) => {
    setSymbols((prev) => prev.filter((_, i) => i !== idx))
  }

  // 更新符号
  const updateSymbol = (idx, patch) => {
    setSymbols((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }

  // 保存配置
  const handleSave = async () => {
    if (!config || symbols.length === 0) {
      toast.error('请至少配置一个符号')
      return
    }
    setSaving(true)
    try {
      // 保存基础配置
      await adminApi2.updateSlotMachineConfig({
        name: config.name,
        is_active: config.is_active,
        cost_points: Number(config.cost_points) || 30,
        reels: Number(config.reels) || 3,
        two_kind_multiplier: Number(config.two_kind_multiplier) || 1.5,
        jackpot_symbol_key: config.jackpot_symbol_key,
      })
      // 保存符号配置
      await adminApi2.replaceSlotMachineSymbols({
        symbols: symbols.map((s) => ({
          ...s,
          multiplier: Number(s.multiplier) || 1,
          weight: Number(s.weight) || 1,
          sort_order: Number(s.sort_order) || 0,
        })),
      })
      toast.success('配置保存成功')
      loadConfig()
      loadStats()
    } catch (e) {
      toast.error(e?.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 计算总权重和概率
  const totalWeight = useMemo(() => {
    return symbols.filter(s => s.is_enabled && s.weight > 0).reduce((sum, s) => sum + Number(s.weight || 0), 0)
  }, [symbols])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-green-500" /></div>
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <Dice1 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400 mb-4">老虎机配置不存在</p>
        <p className="text-sm text-slate-400">请先执行数据库迁移脚本 019_slot_machine_config.sql</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面说明和统计 */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-200/50 dark:border-green-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <Dice1 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">老虎机管理</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">配置符号、倍率和权重来控制胜率</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { loadConfig(); loadStats(); }}
              className="px-4 py-2 text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-2 disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              保存配置
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="p-3 bg-white/80 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">7日抽奖次数</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.total_draws}</p>
            </div>
            <div className="p-3 bg-white/80 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">实际返奖率</p>
              <p className={`text-lg font-bold ${stats.actual_rtp > 100 ? 'text-red-500' : 'text-green-500'}`}>
                {stats.actual_rtp}%
              </p>
            </div>
            <div className="p-3 bg-white/80 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">中奖率</p>
              <p className="text-lg font-bold text-blue-500">{stats.win_rate}%</p>
            </div>
            <div className="p-3 bg-white/80 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">平台收益</p>
              <p className={`text-lg font-bold ${stats.house_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.house_profit >= 0 ? '+' : ''}{stats.house_profit}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 基础配置 */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
        <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-green-500" />
          基础配置
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">名称</label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => setConfig((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">消耗积分</label>
            <input
              type="number"
              value={config.cost_points}
              onChange={(e) => setConfig((p) => ({ ...p, cost_points: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">两连倍数</label>
            <input
              type="number"
              step="0.1"
              value={config.two_kind_multiplier}
              onChange={(e) => setConfig((p) => ({ ...p, two_kind_multiplier: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
            />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={!!config.is_active}
                onChange={(e) => setConfig((p) => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 rounded text-green-500"
              />
              启用老虎机
            </label>
          </div>
        </div>
        {metrics && (
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>总权重：{metrics.total_weight}</span>
            <span>启用符号：{metrics.enabled_count}</span>
            <span>理论返奖率：<span className={metrics.theoretical_rtp > 100 ? 'text-red-500' : 'text-green-500'}>{metrics.theoretical_rtp}%</span></span>
          </div>
        )}
      </div>

      {/* 符号配置 */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            符号配置
            <span className="text-sm font-normal text-slate-400">（权重越大，出现概率越高）</span>
          </h4>
          <button
            onClick={addSymbol}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            添加符号
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left py-3 px-2">符号</th>
                <th className="text-left py-3 px-2">Key</th>
                <th className="text-left py-3 px-2">名称</th>
                <th className="text-left py-3 px-2">三连倍率</th>
                <th className="text-left py-3 px-2">权重</th>
                <th className="text-left py-3 px-2">概率</th>
                <th className="text-left py-3 px-2">启用</th>
                <th className="text-left py-3 px-2">大奖</th>
                <th className="text-right py-3 px-2">操作</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-white">
              {symbols.map((s, idx) => {
                const prob = totalWeight > 0 && s.is_enabled && s.weight > 0
                  ? ((s.weight / totalWeight) * 100).toFixed(2)
                  : '0.00'
                return (
                  <tr key={`${s.symbol_key}-${idx}`} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-2">
                      <input
                        className="w-16 px-2 py-1.5 text-2xl text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        value={s.emoji}
                        onChange={(e) => updateSymbol(idx, { emoji: e.target.value })}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        className="w-24 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                        value={s.symbol_key}
                        onChange={(e) => updateSymbol(idx, { symbol_key: e.target.value })}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        value={s.name}
                        onChange={(e) => updateSymbol(idx, { name: e.target.value })}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        value={s.multiplier}
                        onChange={(e) => updateSymbol(idx, { multiplier: e.target.value })}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        value={s.weight}
                        onChange={(e) => updateSymbol(idx, { weight: e.target.value })}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <span className={`font-mono ${s.is_enabled ? 'text-green-500' : 'text-slate-400'}`}>
                        {prob}%
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={!!s.is_enabled}
                        onChange={(e) => updateSymbol(idx, { is_enabled: e.target.checked })}
                        className="w-4 h-4 rounded text-green-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={!!s.is_jackpot}
                        onChange={(e) => updateSymbol(idx, { is_jackpot: e.target.checked })}
                        className="w-4 h-4 rounded text-yellow-500"
                      />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => removeSymbol(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {symbols.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无符号配置，请添加符号</p>
          </div>
        )}
      </div>

      {/* 当前符号预览 */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
        <h4 className="font-semibold text-slate-800 dark:text-white mb-4">符号预览</h4>
        <div className="flex flex-wrap gap-3">
          {symbols.filter(s => s.is_enabled).map((s, i) => (
            <div key={i} className={`p-3 rounded-xl border ${s.is_jackpot ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
              <div className="text-3xl text-center mb-1">{s.emoji}</div>
              <div className="text-xs text-center text-slate-600 dark:text-slate-300">{s.name}</div>
              <div className="text-xs text-center font-bold text-green-500">{s.multiplier}x</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 扭蛋机管理面板 - 显示奖池配置（只读）
function GachaManagePanel() {
  const [status, setStatus] = useState(null)
  const [prizes, setPrizes] = useState([])
  const [loading, setLoading] = useState(true)

  // 扭蛋机配置（与后端一致）
  const GACHA_COST = 50

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statusRes, prizesRes] = await Promise.all([
        api.get('/gacha/status'),
        api.get('/gacha/prizes')
      ])
      setStatus(statusRes)
      setPrizes(prizesRes.prizes || [])
    } catch (error) {
      console.error('加载扭蛋机数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取奖品图标
  const getPrizeIcon = (type) => {
    return type === 'points' ? Coins : Package
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  // 计算总权重
  const totalWeight = status?.total_weight || prizes.reduce((sum, p) => sum + (p.weight || 0), 0)

  return (
    <div className="space-y-6">
      {/* 页面说明 */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
            <CircleDot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">扭蛋机配置</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              扭蛋机奖池配置为固定配置，用户每次扭蛋直接获得积分或道具奖励
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              单次消耗: <span className="font-bold text-purple-600">{GACHA_COST}</span> 积分
            </span>
          </div>
          <div className="text-slate-300 dark:text-slate-600">|</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            奖励直接发放到账户，无需兑换码
          </div>
        </div>
      </div>

      {/* 奖池配置 */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            奖池配置
          </h4>
          <button
            onClick={loadData}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">奖品名称</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">类型</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500 dark:text-slate-400">稀有度</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500 dark:text-slate-400">中奖概率</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map((prize, index) => {
                const Icon = getPrizeIcon(prize.type)
                const probability = totalWeight > 0 ? ((prize.weight || 0) / totalWeight * 100).toFixed(1) : 0
                return (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${prize.type === 'points' ? 'text-yellow-500' : 'text-blue-500'}`} />
                        <span className="font-medium text-slate-700 dark:text-slate-200">{prize.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prize.type === 'points'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {prize.type === 'points' ? '积分' : '道具'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {prize.is_rare ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          稀有
                        </span>
                      ) : (
                        <span className="text-slate-400">普通</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono ${prize.is_rare ? 'text-purple-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                        {probability}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          * 奖池配置在后端代码中定义，如需调整请修改 backend/app/api/v1/endpoints/gacha.py 中的 GACHA_PRIZES 配置
        </p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
          <div className="text-sm text-slate-500 dark:text-slate-400">奖品种类</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{prizes.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
          <div className="text-sm text-slate-500 dark:text-slate-400">稀有奖品</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{prizes.filter(p => p.is_rare).length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
          <div className="text-sm text-slate-500 dark:text-slate-400">单次消耗</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{GACHA_COST} 积分</div>
        </div>
      </div>
    </div>
  )
}

// 主页面组件
export default function ActivityManagePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState('overview')

  // 权限检查
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">无权访问</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">此页面仅限管理员访问</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: '活动概览', icon: TrendingUp },
    { id: 'signin', name: '签到配置', icon: Calendar },
    { id: 'lottery', name: '抽奖配置', icon: Gift },
    { id: 'scratch', name: '刮刮乐管理', icon: Ticket },
    { id: 'slot', name: '老虎机管理', icon: Dice1 },
    { id: 'gacha', name: '扭蛋机管理', icon: CircleDot },
    { id: 'exchange', name: '兑换商城', icon: ShoppingBag },
    { id: 'users', name: '用户积分', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-pink-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                活动管理中心
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">管理积分、抽奖、签到等活动配置</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              管理后台
            </button>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
            >
              {tab.name}
            </Tab>
          ))}
        </div>

        {/* 内容区 */}
        <div className="min-h-[500px]">
          {activeTab === 'overview' && <OverviewPanel />}
          {activeTab === 'signin' && <SigninConfigPanel />}
          {activeTab === 'lottery' && <LotteryConfigPanel />}
          {activeTab === 'scratch' && <ScratchManagePanel />}
          {activeTab === 'slot' && <SlotMachineManagePanel />}
          {activeTab === 'gacha' && <GachaManagePanel />}
          {activeTab === 'exchange' && <ExchangeManagePanel />}
          {activeTab === 'users' && <UserPointsPanel />}
        </div>
      </div>
    </div>
  )
}
