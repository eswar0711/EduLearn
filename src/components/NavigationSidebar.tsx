import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  BookOpen,
  LogOut,
  PlusCircle,
  Home,
  FileText,
  Calculator,
  Sparkles,
  User as UserIcon,
  Lock,
  BarChart3,
  Users,
  Code2,
  Menu,
  X,
} from 'lucide-react'
import { signOut } from '../utils/auth'
import type { User } from '../utils/supabaseClient'

interface NavigationSidebarProps {
  user: User
}

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  // ✅ ESC closes sidebar (same as reference)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
      window.location.reload()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const isActive = (path: string) => location.pathname === path

  // 🔁 EXACT NavItem pattern from reference
  const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
    <Link
      to={to}
      onClick={() => setIsOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium
        transition-all duration-200
        ${
          isActive(to)
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
        }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )

  return (
    <>
      {/* 📱 Mobile Menu Button (REFERENCE STYLE) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        className="md:hidden fixed top-4 left-4 z-50 p-2
        bg-gradient-to-r from-orange-200 to-purple-200
        text-gray-600 rounded-xl shadow-md
        hover:from-purple-400 hover:to-orange-400
        transition-all duration-300"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main Navigation"
        className={`fixed md:relative top-0 left-0 h-screen w-64 bg-white
        border-r border-gray-200 shadow-sm z-40
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">EduVerge</h1>
          </div>
          <p className="text-sm font-medium text-gray-800">
            {user.full_name || 'User'}
          </p>
          <p className="text-xs text-gray-500 capitalize mt-1">
            {user.role === 'admin'
              ? '🔐 Admin'
              : user.role === 'faculty'
              ? '👨‍🏫 Faculty'
              : '👨‍🎓 Student'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard */}
          <NavItem to="/" icon={<Home className="w-5 h-5" />} label="Dashboard" />

          {/* ADMIN */}
          {user.role === 'admin' && (
            <>
              <NavItem
                to="/admin/users"
                icon={<Users className="w-5 h-5" />}
                label="User Management"
              />
              <NavItem
                to="/admin/submissions"
                icon={<FileText className="w-5 h-5" />}
                label="View Submissions"
              />
              <NavItem
                to="/admin/analytics"
                icon={<BarChart3 className="w-5 h-5" />}
                label="Analytics"
              />
              <NavItem
                to="/admin/coding-analytics"
                icon={<Code2 className="w-5 h-5" />}
                label="Coding Analytics"
              />
            </>
          )}

          {/* FACULTY */}
          {user.role === 'faculty' && (
            <>
              <NavItem
                to="/create-assessment"
                icon={<PlusCircle className="w-5 h-5" />}
                label="Create Assessment"
              />
              <NavItem
                to="/course-materials"
                icon={<FileText className="w-5 h-5" />}
                label="Course Materials"
              />
              <NavItem
                to="/coding-management"
                icon={<Code2 className="w-5 h-5" />}
                label="Coding Problems"
              />
            </>
          )}

          {/* STUDENT */}
          {user.role === 'student' && (
            <>
              <NavItem
                to="/courses"
                icon={<BookOpen className="w-5 h-5" />}
                label="Course Materials"
              />
              <NavItem
                to="/coding-lab"
                icon={<Code2 className="w-5 h-5" />}
                label="Coding Lab"
              />
              <NavItem
                to="/score-calculator"
                icon={<Calculator className="w-5 h-5" />}
                label="Score Calculator"
              />
              <NavItem
                to="/ai-assistant"
                icon={<Sparkles className="w-5 h-5" />}
                label="AI Assistant"
              />
            </>
          )}

          <div className="my-4 h-px bg-gray-200" />

          <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2">
            Settings
          </div>

          <NavItem
            to="/profile"
            icon={<UserIcon className="w-5 h-5" />}
            label="My Profile"
          />
          <NavItem
            to="/change-password"
            icon={<Lock className="w-5 h-5" />}
            label="Change Password"
          />
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3
            text-red-600 hover:bg-red-50 rounded-lg
            w-full font-medium transition"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 🧱 Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default NavigationSidebar
