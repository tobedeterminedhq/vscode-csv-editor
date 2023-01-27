import React, {useEffect, useState} from "react";
import {TableComponent} from "./Table";
import {vscode} from "./utilities/VSCodeAPIWrapper";
import './App.css';

export const App: React.FC = () => {
    const [csvFile, setCSVFile] = useState<string[][]>([]);

    function updateData(data: string[][]) {
        vscode.postMessage({command: "update", data});
    }

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            console.log(event)
            if (event.data.type !== "update") {
                throw Error("Unknown message type: " + event.data.type)
            }
            const data = event.data.text
            console.log("data coming over", data)
            const lines = data.split("\n")
            const rows = lines.map((line) => line.split(","))
            setCSVFile(rows)
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    if (csvFile.length === 0) {
        return <div>Loading...</div>
    }

    return <TableComponent data={csvFile} changeData={updateData} />
}

// TODO Reinstate the tsc check in build steps