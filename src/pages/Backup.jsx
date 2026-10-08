import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function Backup() {
  const navigate = useNavigate()

  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(true)

  // Import State
  const [importFile, setImportFile] = useState(null)
  const [importData, setImportData] = useState(null)
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState('')

  const loadDataStats = async () => {
    try {
      setLoading(true)
      const count = await db.repairs.count()
      setTotalRecords(count)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDataStats()
  }, [])

  // EXPORT TO JSON
  const handleExport = async () => {
    try {
      const allRecords = await db.repairs.toArray()

      const backupObject = {
        application: 'Prem Workshop OS',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalRecords: allRecords.length,
        repairs: allRecords,
      }

      const jsonStr = JSON.stringify(backupObject, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const dateStr = new Date().toISOString().split('T')[0]
      const link = document.createElement('a')
      link.href = url
      link.download = `workshop-backup-${dateStr}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert(`✅ Backup file downloaded successfully! (${allRecords.length} records saved)`)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data: ' + err.message)
    }
  }

  // FILE SELECTION FOR IMPORT
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setImportError('')
    setImportSuccess('')
    setImportData(null)

    if (!file) {
      setImportFile(null)
      return
    }

    setImportFile(file)
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        let records = []

        if (Array.isArray(parsed)) {
          records = parsed
        } else if (parsed && Array.isArray(parsed.repairs)) {
          records = parsed.repairs
        } else {
          throw new Error('Invalid backup file structure: could not find repairs array.')
        }

        if (records.length === 0) {
          throw new Error('Backup file is empty (contains 0 records).')
        }

        setImportData(records)
      } catch (err) {
        setImportError(err.message || 'Failed to read or parse JSON file')
      }
    }

    reader.readAsText(file)
  }

  // EXECUTE RESTORE
  const executeRestore = async (mode) => {
    if (!importData || importData.length === 0) {
      alert('No valid records found in selected file.')
      return
    }

    const confirmMsg =
      mode === 'replace'
        ? `⚠️ WARNING: This will DELETE all ${totalRecords} existing records on this device and replace them with ${importData.length} records from the backup file.\n\nAre you sure you want to proceed?`
        : `This will merge ${importData.length} records into your existing ${totalRecords} records.\n\nProceed with merge?`

    if (!window.confirm(confirmMsg)) return

    try {
      setImporting(true)

      if (mode === 'replace') {
        await db.repairs.clear()
        await db.repairs.bulkAdd(importData)
      } else {
        // Merge & update
        await db.repairs.bulkPut(importData)
      }

      await loadDataStats()
      setImportSuccess(`Successfully restored ${importData.length} records!`)
      setImportFile(null)
      setImportData(null)
      alert(`✅ Restore complete! Total workshop records now: ${await db.repairs.count()}`)
    } catch (err) {
      console.error('Restore failed:', err)
      setImportError('Restore failed: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="page backup-page">
      <div className="dashboard-container" style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div className="page-header-row">
          <div>
            <div className="sub-badge">DATA PROTECTION</div>
            <h1 className="page-main-title">Workshop Data Backup & Restore</h1>
            <p className="page-sub-title">
              Safely save your complete workshop history to your computer or restore from a previous backup file
            </p>
          </div>

          <button className="btn-secondary-flat" onClick={() => navigate('/')}>
            &larr; Back to Dashboard
          </button>
        </div>

        {/* Current Database Status */}
        <div className="stat-card stat-total" style={{ marginBottom: '24px' }}>
          <div className="stat-icon-wrapper">
            <span>💾</span>
          </div>
          <div className="stat-data">
            <span className="stat-title">Current Workshop Records on Device</span>
            <div className="stat-number-row">
              <span className="stat-number">{loading ? '...' : totalRecords}</span>
              <span className="stat-badge neutral">Active Job Cards</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: Export Data */}
        <div className="form-card-section" style={{ marginBottom: '24px' }}>
          <div className="section-title-row">
            <div className="section-number-badge">1</div>
            <div>
              <h2>Download Workshop Backup File</h2>
              <p>Save all customer profiles, repair logs, bills, and payment records to a secure JSON file</p>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Tip: Download a backup once every week or before clearing your browser history so your workshop records stay protected.
          </p>

          <button
            type="button"
            className="btn-primary-elevated"
            onClick={handleExport}
            disabled={totalRecords === 0}
            style={{ fontSize: '1rem', padding: '12px 24px' }}
          >
            <span>📥 Download Backup File (.json)</span>
          </button>
        </div>

        {/* SECTION 2: Restore / Import Data */}
        <div className="form-card-section">
          <div className="section-title-row">
            <div className="section-number-badge">2</div>
            <div>
              <h2>Restore Data from Backup File</h2>
              <p>Import a previously saved JSON backup file to recover records or sync from another computer</p>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px' }}>
              Select Backup File (.json)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{
                display: 'block',
                padding: '10px 14px',
                border: '1.5px dashed var(--border-medium)',
                borderRadius: '8px',
                width: '100%',
                background: 'var(--bg-surface)',
              }}
            />
          </div>

          {importError && (
            <div className="date-error" style={{ marginBottom: '16px' }}>
              ⚠️ {importError}
            </div>
          )}

          {importSuccess && (
            <div style={{ padding: '12px 16px', background: 'var(--emerald-50)', color: 'var(--emerald-700)', border: '1px solid var(--emerald-100)', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>
              ✅ {importSuccess}
            </div>
          )}

          {importData && (
            <div style={{ padding: '16px', background: 'var(--bg-card-muted)', borderRadius: '10px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>Backup File Inspection:</h4>
              <p style={{ margin: '0 0 14px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                File: <strong>{importFile?.name}</strong> • Found <strong>{importData.length} records</strong> ready to be restored.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary-elevated"
                  onClick={() => executeRestore('merge')}
                  disabled={importing}
                >
                  {importing ? 'Restoring...' : '🔄 Merge with Existing Data'}
                </button>

                <button
                  type="button"
                  className="btn-secondary-flat"
                  style={{ color: 'var(--rose-700)', borderColor: 'var(--rose-200)' }}
                  onClick={() => executeRestore('replace')}
                  disabled={importing}
                >
                  {importing ? 'Restoring...' : '⚠️ Replace All (Full Overwrite)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Backup
