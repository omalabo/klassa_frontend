// ShareClassPage.tsx — Page dédiée au lien de partage (?classe=ID)
// Onglet 1 : la classe partagée (inscription directe)
// Onglet 2 : rechercher d'autres classes
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { selectAuth } from '../../store/authSlice'
import api from '../../config/axios'
import { Class } from '../../types'
import { useAppLanguage } from '../../i18n/appLanguage'

// ─── Wrapper : redirection si non connecté ───────────────────
export default function ShareClassPage() {
  const { token } = useAppSelector(selectAuth)
  const location = useLocation()

  // 🔒 Pas connecté → login, puis retour sur cette page
  if (!token) {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{ from: { pathname: location.pathname + location.search } }}
      />
    )
  }
  return <ShareClassContent />
}

// ─── Contenu principal (connecté) ────────────────────────────
function ShareClassContent() {
  const { t } = useAppLanguage()
  const [searchParams] = useSearchParams()
const encodedClassId = searchParams.get('c')

// Décoder l'ID depuis base64 court
const decodeClassId = (encoded: string | null): string | null => {
if (!encoded) return null
try {
    // Ajouter le padding si nécessaire
    const padded = encoded + '='.repeat((4 - encoded.length % 4) % 4)
    const decoded = atob(padded)
    // Vérifier que c'est bien un UUID (36 caractères avec tirets)
    if (decoded.length >= 8 && /^[a-f0-9-]+$/i.test(decoded)) {
    return decoded
    }
} catch {}
return null
}

const sharedClassId = decodeClassId(encodedClassId)
  const { user } = useAppSelector(selectAuth)
  const isEleve = user?.role === 'eleve'

  const [tab, setTab] = useState<'shared' | 'others'>(sharedClassId ? 'shared' : 'others')

  // Classe partagée
  const [sharedClass, setSharedClass] = useState<Class | null>(null)
  const [loadingShared, setLoadingShared] = useState(!!sharedClassId)
  const [sharedError, setSharedError] = useState(false)

  // Recherche autres classes
  const [searchQuery, setSearchQuery] = useState('')
  const [classesDisponibles, setClassesDisponibles] = useState<Class[]>([])
  const [mesInscriptions, setMesInscriptions] = useState<any[]>([])
  const [loadingDisponibles, setLoadingDisponibles] = useState(false)
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null)
  const [inscriptionLoading, setInscriptionLoading] = useState<string | null>(null)

  // ── Charger la classe partagée ──
  useEffect(() => {
    if (!sharedClassId) return
    setLoadingShared(true)
    setSharedError(false)
    api.get(`/classes/${sharedClassId}/`)
      .then(res => setSharedClass(res.data))
      .catch(() => setSharedError(true))
      .finally(() => setLoadingShared(false))
  }, [sharedClassId])

  // ── Charger classes disponibles + mes inscriptions ──
  const loadAll = useCallback(async () => {
    if (!user?.id) return
    setLoadingDisponibles(true)
    try {
      const [classesRes, inscriptionsRes] = await Promise.all([
        api.get('/classes/', { params: { disponibles: 'true' } }),
        api.get('/inscriptions/', { params: { eleve_id: user.id } }),
      ])
      setClassesDisponibles(classesRes.data.results || classesRes.data || [])
      setMesInscriptions(inscriptionsRes.data.results || inscriptionsRes.data || [])
    } catch (err) {
      console.error('Erreur chargement classes:', err)
    } finally {
      setLoadingDisponibles(false)
    }
  }, [user?.id])

  useEffect(() => { loadAll() }, [loadAll])

  const getInscriptionState = (classeId: string) => {
    const inscription = mesInscriptions.find(
      (i: any) => i.classe === classeId || i.classe_id === classeId
    )
    if (!inscription) return 'none'
    if (inscription.statut === 'active') return 'inscrit'
    if (['en_attente', 'attente', 'demande_envoyee'].includes(inscription.statut)) return 'demande'
    return 'none'
  }

  const handleDemandeInscription = async (classeId: string) => {
    if (!user?.id) return
    setInscriptionLoading(classeId)
    try {
      await api.post('/inscriptions/', { classe: classeId, eleve: user.id, statut: 'en_attente' })
      await loadAll()
      alert(`✅ ${t('request_sent')}`)
    } catch (err: any) {
      const data = err?.response?.data
      const message =
        data?.classe?.[0] || data?.classe ||
        data?.eleve?.[0] || data?.eleve ||
        data?.detail || data?.error || '❌'
      alert(`❌ ${message}`)
    } finally {
      setInscriptionLoading(null)
    }
  }

  const classesFiltrees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return classesDisponibles
    return classesDisponibles.filter((cls: Class) =>
      (cls.nom || '').toLowerCase().includes(q) ||
      (cls.programme || '').toLowerCase().includes(q) ||
      ((cls as any).details_cours || '').toLowerCase().includes(q)
    )
  }, [classesDisponibles, searchQuery])

  // ─── Carte de classe (même style que le modal de recherche) ───
  const renderClassCard = (cls: Class, forceExpanded = false) => {
    const state = getInscriptionState(cls.id)
    const expanded = forceExpanded || expandedClassId === cls.id
    return (
      <div key={cls.id} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 16, transition: 'all .15s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{cls.nom}</h4>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', fontWeight: 600 }}>{cls.programme || ''}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            {!isEleve ? (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 20, background: '#fef9c3', border: '1.5px solid #fde68a', color: '#854d0e', whiteSpace: 'nowrap', textAlign: 'right' }}>
                {t('student_account_required')}
              </span>
            ) : state === 'inscrit' ? (
              <span style={{ fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 20, background: 'rgba(52,211,153,.15)', border: '1.5px solid rgba(52,211,153,.45)', color: '#059669', whiteSpace: 'nowrap' }}>
                ✅ {t('enrolled_students')}
              </span>
            ) : state === 'demande' ? (
              <span style={{ fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 20, background: 'rgba(251,191,36,.15)', border: '1.5px solid rgba(251,191,36,.45)', color: '#b45309', whiteSpace: 'nowrap' }}>
                ⏳ {t('request_sent')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleDemandeInscription(cls.id)}
                disabled={inscriptionLoading === cls.id}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: 'none',
                  background: inscriptionLoading === cls.id ? '#e2e8f0' : 'linear-gradient(135deg, #60a5fa, #2563eb)',
                  color: inscriptionLoading === cls.id ? '#64748b' : '#fff',
                  fontSize: 12, fontWeight: 800,
                  cursor: inscriptionLoading === cls.id ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: inscriptionLoading === cls.id ? 'none' : '0 4px 14px rgba(37,99,235,.35)',
                  transition: 'all .15s'
                }}
              >
                {inscriptionLoading === cls.id ? '…' : `🎓 ${t('join_class')}`}
              </button>
            )}
            {!forceExpanded && (
              <button
                type="button"
                onClick={() => setExpandedClassId(expanded ? null : cls.id)}
                style={{ padding: '6px 10px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#ffffff', color: '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {t('details')} {expanded ? '▲' : '▼'}
              </button>
            )}
          </div>
        </div>
        {expanded && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              {t('course_details')}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {(cls as any).details_cours || '—'}
            </p>
            <div style={{ marginTop: 12, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px' }}>
              <p style={{ margin: 0, fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>{t('course_title_program')}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#1e293b', fontWeight: 600 }}>{cls.programme || '—'}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const spinner = (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
      <span style={{ width: 22, height: 22, border: '2px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'block' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px', fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#4f46e5', letterSpacing: '-0.5px' }}>Klassa</h1>
      </div>

      {/* Carte principale */}
      <div style={{ width: '100%', maxWidth: 620, background: '#ffffff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(0,0,0,.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Onglets */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => setTab('shared')}
            style={{
              flex: 1, padding: '13px 10px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800,
              background: tab === 'shared' ? '#eef2ff' : 'transparent',
              color: tab === 'shared' ? '#4f46e5' : '#64748b',
              borderBottom: tab === 'shared' ? '2.5px solid #6366f1' : '2.5px solid transparent',
              transition: 'all .15s'
            }}
          >
            🎯 {t('tab_shared_class')}
          </button>
          <button
            type="button"
            onClick={() => setTab('others')}
            style={{
              flex: 1, padding: '13px 10px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800,
              background: tab === 'others' ? '#eef2ff' : 'transparent',
              color: tab === 'others' ? '#4f46e5' : '#64748b',
              borderBottom: tab === 'others' ? '2.5px solid #6366f1' : '2.5px solid transparent',
              transition: 'all .15s'
            }}
          >
            🔍 {t('tab_other_classes')}
          </button>
        </div>

        {/* Contenu */}
        <div style={{ padding: 20, overflowY: 'auto', maxHeight: '68vh', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'shared' ? (
            !sharedClassId ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 14 }}>
                <div style={{ fontSize: 34, marginBottom: 8 }}>📚</div>
                {t('class_unavailable')}
              </div>
            ) : loadingShared ? spinner
            : sharedError || !sharedClass ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 14 }}>
                <div style={{ fontSize: 34, marginBottom: 8 }}>🚫</div>
                {t('class_unavailable')}
              </div>
            ) : (
              renderClassCard(sharedClass, true)
            )
          ) : (
            <>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`🔍 ${t('search_class')}...`}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              {loadingDisponibles ? spinner
              : classesFiltrees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 14 }}>
                  <div style={{ fontSize: 34, marginBottom: 8 }}>📚</div>
                  {t('no_class_found')}
                </div>
              ) : (
                classesFiltrees.map(cls => renderClassCard(cls))
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
        © {new Date().getFullYear()} Klassa • {t('all_rights_reserved')}
      </p>
    </div>
  )
}