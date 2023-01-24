import React, {useEffect, useState} from "react";

interface Message {
    type: 'updateFromApp'
    data: string
}

export const App: React.FC = () => {
    const [csvFile, setCSVFile] = useState<string>('');

    const dispatchEvent = (message: Message) => {
        window.dispatchEvent(new MessageEvent('message', message));
    }

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = event.data;
            console.log(data)
            setCSVFile(data.text)
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    return <>
        <div>Hello World 1</div>
        {csvFile}
        <button onClick={() => dispatchEvent({type: 'updateFromApp', data: '123'})}>Update</button>
        </>
}
