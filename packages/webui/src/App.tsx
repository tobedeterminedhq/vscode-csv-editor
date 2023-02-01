import React, { useEffect, useState } from 'react'
import { TableComponent } from './Table'
import { vscode } from './utilities/VSCodeAPIWrapper'
import './App.css'

export const App: React.FC = () => {
  // TODO Add a loading state
  const [csvFile, setCSVFile] = useState<string[][]>([['hello'], ['test']])

  // updateData is a callback function that is passed to the TableComponent that sends data back to the extension.
  function updateData(data: string[][]) {
    vscode.postMessage({ command: 'update', data })
  }

  // This useEffect is used to register listeners for messages from the extension.
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
