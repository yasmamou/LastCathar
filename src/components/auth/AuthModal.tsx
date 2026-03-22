'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { X, Mail, Lock, User, Compass, Loader2 } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setError('')
    setLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })

        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Erreur lors de l\'inscription')
          setLoading(false)
          return
        }
      }

      // Sign in (for both login and after register)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
        setLoading(false)
        return
      }

      handleClose()
    } catch {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
          >
            <div className="glass w-full max-w-sm rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-8 pb-4 text-center">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="inline-flex w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 items-center justify-center mb-3">
                  <Compass className="w-5 h-5 text-midnight-950" />
                </div>

                <h2 className="font-display text-xl font-semibold text-white/90">
                  {mode === 'login' ? 'Bon retour, explorateur' : 'Rejoins l\'aventure'}
                </h2>
                <p className="text-xs text-white/30 mt-1">
                  {mode === 'login'
                    ? 'Connecte-toi pour retrouver tes découvertes'
                    : 'Crée ton profil d\'explorateur'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
                {mode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="text"
                      placeholder="Nom d'explorateur"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold-400/40 transition-colors"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold-400/40 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold-400/40 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400/80 text-center px-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 font-semibold text-sm tracking-wide hover:from-gold-300 hover:to-gold-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === 'login' ? (
                    'Se connecter'
                  ) : (
                    'Créer mon profil'
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-xs text-white/30 hover:text-gold-400/60 transition-colors"
                  >
                    {mode === 'login'
                      ? 'Pas encore de compte ? Inscris-toi'
                      : 'Déjà un compte ? Connecte-toi'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
