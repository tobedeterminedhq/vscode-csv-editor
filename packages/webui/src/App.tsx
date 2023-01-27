import React, {useEffect, useState} from "react";
import {TableComponent} from "./Table";
import {vscode} from "./utilities/VSCodeAPIWrapper";

export const App: React.FC = () => {
    const [csvFile, setCSVFile] = useState<string>('');

    function updateData(data: string[][]) {
        vscode.postMessage({command: "update", data});
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
        <div>Hello</div>
        <TableComponent
            data={[["hello", "world"], ["1", "2"], ["3", "4"]]}
            changeData={(row, column, value) => console.log(row, column, value)}
        />
        </>
}
