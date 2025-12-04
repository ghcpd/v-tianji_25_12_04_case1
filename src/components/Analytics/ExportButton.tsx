import React, { useState } from 'react'
import './ExportButton.css'

interface ExportButtonProps {
  onExport: (format: 'csv' | 'json' | 'pdf') => void
}

const ExportButton: React.FC<ExportButtonProps> = ({ onExport }) => {
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    onExport(format)
    setShowMenu(false)
  }

  return (
    <div className="export-button-container">
      <button
        className="export-button"
        onClick={() => setShowMenu(!showMenu)}
      >
        Export
      </button>
      {showMenu && (
        <div className="export-menu">
          <button
            className="export-option"
            onClick={() => handleExport('csv')}
          >
            Export as CSV
          </button>
          <button
            className="export-option"
            onClick={() => handleExport('json')}
          >
            Export as JSON
          </button>
          <button
            className="export-option"
            onClick={() => handleExport('pdf')}
          >
            Export as PDF
          </button>
        </div>
      )}
    </div>
  )
}

export default ExportButton

