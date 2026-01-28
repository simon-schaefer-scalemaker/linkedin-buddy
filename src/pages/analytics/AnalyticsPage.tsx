import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, TrendingUp, Eye, Heart, MessageSquare, Linkedin, Youtube, Instagram, GraduationCap } from 'lucide-react'
import { MOCK_DASHBOARD_STATS, MOCK_CHART_DATA } from '@/lib/mock-data'
import { PLATFORMS } from '@/lib/constants'

const platformIcons = {
  linkedin: Linkedin,
  youtube: Youtube,
  instagram: Instagram,
  skool: GraduationCap
}

export function AnalyticsPage() {
  const stats = MOCK_DASHBOARD_STATS

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-medium text-gray-900">Analytics</h1>
        <p className="text-[13px] text-gray-400 mt-1">Überblick über deine Content-Performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-gray-400 font-medium">Impressionen</p>
                <p className="text-[28px] font-light text-gray-900 mt-1 leading-none">
                  {(stats.totalImpressions / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-gray-400 font-medium">Engagement Rate</p>
                <p className="text-[28px] font-light text-gray-900 mt-1 leading-none">
                  {stats.avgEngagement}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-gray-400 font-medium">Gesamt Posts</p>
                <p className="text-[28px] font-light text-gray-900 mt-1 leading-none">
                  {stats.totalPosts}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Heart className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-gray-400 font-medium">Diese Woche</p>
                <p className="text-[28px] font-light text-gray-900 mt-1 leading-none">
                  {stats.postsThisWeek}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impressions Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Impressionen (14 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12 }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('de-DE')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Engagement (14 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12 }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('de-DE')}
                  />
                  <Bar dataKey="engagement" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">Performance nach Plattform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.platformBreakdown.map((platform) => {
              const platformData = PLATFORMS[platform.platform]
              const Icon = platformIcons[platform.platform]
              return (
                <Link
                  key={platform.platform}
                  to={`/analytics/${platform.platform}`}
                  className="group"
                >
                  <div className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: platformData.color }}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[13px] font-medium text-gray-900">
                        {platformData.name}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-gray-400">Posts</span>
                        <span className="text-gray-700 font-medium">{platform.posts}</span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span className="text-gray-400">Engagement</span>
                        <span className="text-gray-700 font-medium">{platform.engagement}%</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-[11px] text-gray-400 group-hover:text-gray-600 flex items-center gap-1">
                        Details <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
