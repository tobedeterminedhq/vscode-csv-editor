import React, { useEffect, useState } from 'react'
import { TableComponent } from './Table'
import { vscode } from './utilities/VSCodeAPIWrapper'
import './App.css'

export const App: React.FC = () => {
  const [csvFile, setCSVFile] = useState<string[][]>([])

  function updateData(data: string[][]) {
    vscode.postMessage({ command: 'update', data })
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log(event)
      const data = event.data
      console.log(data)
      setCSVFile(data.data)
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return <TableComponent data={csvFile} changeData={updateData} />
}

// TODO Reinstante the tsc check in build steps
