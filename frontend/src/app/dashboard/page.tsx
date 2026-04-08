'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Clock, MoreVertical, Trash2, Smartphone, Edit3, Sparkles } from 'lucide-react'
import { AIPanel } from '@/components/AIPanel'
import { getProjects, deleteProject, createProject, uploadAsset, type PlanCode, type Project } from '@/lib/api-projects'
import { BrandLogo } from '@/components/BrandLogo'

const API_BASE_URL = process.env.PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function Dashboard() {
  const router = useRouter()
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      setLoading(true)
      const data = await getProjects()
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return
    try {
      await deleteProject(id)
      setProjects(projects.filter(p => p.id !== id))
      setOpenMenu(null)
    } catch (err) {
      alert('Failed to delete project')
      console.error(err)
    }
  }

  async function handleCreateSampleProject() {
    try {
      setLoading(true)
      setError(null)

      // First check if backend is available
      try {
        const healthCheck = await fetch(`${API_BASE_URL}/health`)
        if (!healthCheck.ok) {
          throw new Error('Backend server is not responding')
        }
      } catch (err) {
        alert(`Cannot connect to backend server. Please make sure it is running at ${API_BASE_URL}`)
        setLoading(false)
        return
      }

      // Create sample screenshots using canvas
      const colors = ['#667eea', '#f093fb', '#4facfe']
      const screenshotIds: string[] = []

      for (let i = 0; i < 3; i++) {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = 400
          canvas.height = 800
          const ctx = canvas.getContext('2d')
          if (!ctx) continue

          // Draw gradient background
          const grd = ctx.createLinearGradient(0, 0, 0, 800)
          grd.addColorStop(0, colors[i])
          grd.addColorStop(1, i === 0 ? '#764ba2' : i === 1 ? '#f5576c' : '#00f2fe')
          ctx.fillStyle = grd
          ctx.fillRect(0, 0, 400, 800)

          // Add screen number
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 48px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`Screen ${i + 1}`, 200, 400)

          const dataUrl = canvas.toDataURL('image/png')
          const response = await fetch(dataUrl)
          const blob = await response.blob()
          const file = new File([blob], `sample-screen-${i + 1}.png`, { type: 'image/png' })
          const result = await uploadAsset(file, 'screenshot')
          screenshotIds.push(result.asset.id)
        } catch (err) {
          console.error('Failed to upload sample image:', err)
          setError('Failed to upload sample image')
        }
      }

      if (screenshotIds.length === 0) {
        alert('Failed to create sample project. Please check if Supabase is configured.')
        setLoading(false)
        return
      }

      const result = await createProject({
        name: 'Sample Fitness App',
        description: 'A demo project showcasing iOS Kit features',
        screenshotIds,
      })

      router.push(`/projects/${result.project.id}`)
    } catch (err) {
      alert('Failed to create sample project: ' + (err as Error).message)
      console.error(err)
      setError((err as Error).message)
      setLoading(false)
    }
  }

  const deviceLabels: Record<string, string> = {
    iphone_65: 'iPhone 6.5"',
    iphone_67: 'iPhone 6.7"',
    iphone_55: 'iPhone 5.5"',
    ipad_129: 'iPad 12.9"',
    ipad_11: 'iPad 11"',
    ipad_109: 'iPad 10.9"',
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <main className="flex-1 overflow-auto p-6 lg:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-black">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold uppercase tracking-wider">My Projects</h1>
            <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-widest">Project Dashboard</p>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="btn-brutal flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-mono uppercase tracking-wider">Loading projects...</p>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="text-center">
                <Smartphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-mono uppercase tracking-wider text-gray-500">No projects yet</p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => router.push('/projects/new')}
                    className="px-6 py-3 border-2 border-black bg-black text-white hover:bg-red-500 transition-colors font-display font-bold uppercase tracking-wider"
                  >
                    Create New Project
                  </button>
                  <button
                    onClick={handleCreateSampleProject}
                    disabled={loading}
                    className="px-6 py-3 border-2 border-black bg-yellow-400 hover:bg-yellow-500 transition-colors font-display font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Try Sample Project
                  </button>
                </div>
              </div>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="card-brutal p-6 group relative"
              >
                <div className="absolute left-4 top-4 z-10">
                  <PlanBadge planCode={project.entitlementSummary?.planCode || 'free'} />
                </div>

                {/* Three dots menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                    className="p-1 hover:bg-gray-100 border border-transparent hover:border-black"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenu === project.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenu(null)}
                      />
                      <div className="absolute right-0 top-8 w-48 bg-white border-2 border-black shadow-lg z-20">
                        <button
                          onClick={() => {
                            router.push(`/projects/${project.id}`)
                            setOpenMenu(null)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-yellow-50 border-b border-black text-left"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span className="text-sm font-bold uppercase">View Project</span>
                        </button>
                        <button
                          onClick={() => {
                            router.push(`/projects/${project.id}/screenshots`)
                            setOpenMenu(null)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-yellow-50 border-b border-black text-left"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="text-sm font-bold uppercase">Edit Screenshots</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(project.id)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm font-bold uppercase">Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div
                  className="cursor-pointer"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-4 pt-8">
                    <BrandLogo
                      showText={false}
                      markClassName="w-14 h-14 bg-transparent"
                      imageClassName="object-contain p-0"
                    />
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="font-display font-bold text-xl uppercase mb-1">{project.name}</h3>
                  <p className="text-xs font-mono text-gray-500 mb-4 uppercase">
                    {project.deviceType ? (deviceLabels[project.deviceType] || project.deviceType) : 'Device not set'}
                  </p>
                  <p className="text-xs font-mono text-gray-500 mb-4 uppercase">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-gray-400">
                    <span className="px-2 py-1 border border-black bg-gray-50">Click card to view details</span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Sample project card */}
          <div
            onClick={handleCreateSampleProject}
            className="border-2 border-black bg-gradient-to-br from-yellow-400 to-orange-400 p-6 flex flex-col items-center justify-center cursor-pointer hover:from-yellow-500 hover:to-orange-500 transition-colors min-h-[200px]"
          >
            <div className="w-14 h-14 border-2 border-black bg-white flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </div>
            <span className="font-display font-bold text-lg uppercase">Try Sample Project</span>
            <span className="text-xs font-mono text-gray-700 mt-1 uppercase">See it in action</span>
          </div>

          {/* New project card */}
          <div
            onClick={() => router.push('/projects/new')}
            className="border-2 border-dashed border-black p-6 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-yellow-50 transition-colors min-h-[200px]"
          >
            <div className="w-14 h-14 border-2 border-black bg-gray-200 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-500" />
            </div>
            <span className="font-display font-bold text-lg uppercase">Create New Project</span>
            <span className="text-xs font-mono text-gray-500 mt-1 uppercase">Start Fresh</span>
          </div>
        </div>

        {/* Decorative footer */}
        <div className="mt-8 flex items-center justify-between text-xs font-mono text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-black" />
            <span className="uppercase tracking-wider">iOS Kit v1.0</span>
          </div>
          <div className="w-32 h-6 barcode" />
        </div>
      </main>

      {/* AI Panel Toggle */}
      {!isAIPanelOpen && (
        <button
          onClick={() => setIsAIPanelOpen(true)}
          className="fixed right-6 bottom-6 p-4 bg-black text-white border-2 border-black btn-brutal z-50 hover:bg-red-500"
        >
          AI
        </button>
      )}
      <AIPanel isOpen={isAIPanelOpen} onClose={() => setIsAIPanelOpen(false)} />
    </div>
  )
}

function PlanBadge({ planCode }: { planCode: PlanCode }) {
  const styles: Record<PlanCode, string> = {
    free: 'bg-white text-black',
    base: 'bg-yellow-300 text-black',
    pro: 'bg-black text-white',
  }

  return (
    <span className={`inline-flex border-2 border-black px-2 py-1 text-[10px] font-mono uppercase tracking-[0.22em] ${styles[planCode]}`}>
      {planCode}
    </span>
  )
}
