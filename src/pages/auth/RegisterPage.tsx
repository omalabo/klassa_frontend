import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppLanguage } from '../../i18n/appLanguage'
import api from '../../config/axios'

export default function RegisterPage() {
  const { t } = useAppLanguage()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    display_name: '',
    homme_femme: '',
    role: '',
    password: '',
    confirm_password: ''
  })
  
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError(t('invalid_email'))
      return false
    }
    
    /* if (!formData.display_name.trim()) {
      setError(t('full_name') + ' requis')
      return false
    } */
    
    if (!formData.role) {
      setError(t('role') + ' requis')
      return false
    }
    
    /* if (!formData.homme_femme) {
      setError(t('gender') + ' requis')
      return false
    } */
    
    if (formData.password.length < 8) {
      setError(t('password_min_8'))
      return false
    }
    
    if (formData.password !== formData.confirm_password) {
      setError(t('passwords_not_match'))
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const response = await api.post('/users/register/', {
        email: formData.email,
        display_name: formData.display_name || formData.email.split('@')[0],
        homme_femme: formData.homme_femme || '',
        role: formData.role,
        password: formData.password
      })
      
      alert(t('register_success'))
      navigate('/login')
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || t('invalid_credentials')
      
      if (errorMessage.includes('déjà utilisé') || errorMessage.includes('already used')) {
        setError(t('email_already_used'))
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white p-4">
      <div className="w-full max-w-md">
        {/* 🏷️ Logo / En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">Klassa</h1>
          <p className="text-neutral-600 mt-2">{t('educational_platform')}</p>
        </div>

        {/* 📦 Carte d'inscription */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6 text-center">
            {t('create_account')}
          </h2>

          {/* ⚠️ Message d'erreur global */}
          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
              {error}
            </div>
          )}

          {/* 📝 Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Rôle */}
            <div>
                <span className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('role')}
                </span>

                <div className="grid grid-cols-2 gap-3">
                    {/* Professeur */}
                    <label
                    className={`cursor-pointer rounded-xl border px-3 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                        formData.role === 'professeur'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm ring-2 ring-primary-200'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:bg-primary-50/40'
                    }`}
                    >
                    <input
                        type="radio"
                        name="role"
                        value="professeur"
                        checked={formData.role === 'professeur'}
                        onChange={handleChange}
                        className="sr-only"
                    />
                    <span>✏️</span>
                    {t('teacher')}
                    </label>

                    {/* Élève */}
                    <label
                    className={`cursor-pointer rounded-xl border px-3 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                        formData.role === 'eleve'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm ring-2 ring-primary-200'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:bg-primary-50/40'
                    }`}
                    >
                    <input
                        type="radio"
                        name="role"
                        value="eleve"
                        checked={formData.role === 'eleve'}
                        onChange={handleChange}
                        className="sr-only"
                    />
                    <span>🎓</span>
                    {t('student')}
                    </label>
                </div>
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="exemple@email.com"
                autoComplete="email"
              />
            </div>

            {/* Nom complet */}
            {/* <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-neutral-700 mb-1">
                {t('full_name')}
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                required
                value={formData.display_name}
                onChange={handleChange}
                className="form-input"
                placeholder="Jean Dupont"
                autoComplete="name"
              />
            </div> */}

            {/* Sexe */}
            {/* <div>
              <label htmlFor="homme_femme" className="block text-sm font-medium text-neutral-700 mb-1">
                {t('gender')}
              </label>
              <select
                id="homme_femme"
                name="homme_femme"
                required
                value={formData.homme_femme}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">-- {t('gender')} --</option>
                <option value="homme">{t('male')}</option>
                <option value="femme">{t('female')}</option>
              </select>
            </div> */}

            

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <p className="text-xs text-neutral-500 mt-1">{t('password_min_8')}</p>
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-neutral-700 mb-1">
                {t('confirm_password')}
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                value={formData.confirm_password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {/* 🔘 Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {t('sending_in_progress')}
                </span>
              ) : (
                t('register')
              )}
            </button>

            {/* Lien vers login */}
            <p className="text-sm text-center mt-4">
              {t('already_have_account')}{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('login')}
              </Link>
            </p>
          </form>
        </div>

        {/* 🏢 Footer */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          © {new Date().getFullYear()} Klassa • {t('all_rights_reserved')}
        </p>
      </div>
    </div>
  )
}