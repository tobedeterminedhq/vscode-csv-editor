import React, { useEffect, useState } from 'react'
import { TableComponent } from './Table'
import { vscode } from './utilities/VSCodeAPIWrapper'
import './App.css'

export const App: React.FC = () => {
  // TODO Add a loading state
  const [csvFile, setCSVFile] = useState<'loading' | string[][]>('loading')

  // updateData is a callback function that is passed to the TableComponent that sends data back to the extension.
  function updateData(data: string[][]) {
    console.log('updating data with data', data)
    const message = {
      command: 'updateData',
      data: data.map((row) => row.join(',')).join('\n'),
    }
    console.log('updating data with data and message', data, message)
    vscode.postMessage({ command: 'updateData', message })
  }

  // This useEffect is used to register listeners for messages from the extension.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('message received', event)
      const eventData = event.data
      if (eventData.type !== 'update') {
        throw new Error('invalid message type, expect update')
      }

      const data = eventData.text
      if (typeof data !== 'string') {
        throw new Error('invalid message data, expect string')
      }
      const newData = data.split('\n').map((row) => row.split(','))

      console.log(data)
      // setCSVFile(data.data)
      setCSVFile(newData)
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  if (csvFile === 'loading') {
    return <div>Loading...</div>
  }

  return <TableComponent data={csvFile} changeData={updateData} />
}

// TODO Reinstate the tsc check in build steps
