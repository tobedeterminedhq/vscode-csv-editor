import React from 'react'
import {
    Column,
    Table,
    ColumnDef,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    RowData, Updater, TableState, CellContext, RowModel, createColumnHelper,
} from '@tanstack/react-table'


export interface Props {
    data: string[][]
    changeData: (row: number, column: number, value: string) => void
}


// Give our default column cell renderer editing superpowers!
const defaultColumn = {
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
        const initialValue = getValue()
        // We need to keep and update the state of the cell normally
        const [value, setValue] = React.useState(initialValue)

        // When the input is blurred, we'll call our table meta's updateData function
        const onBlur = () => {
            table.options.meta?.updateData(index, id, value)
        }

        // If the initialValue is changed external, sync it up with our state
        React.useEffect(() => {
            setValue(initialValue)
        }, [initialValue])

        return (
            <input
                value={value as string}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
            />
        )
    },
}


export const TableComponent: React.FC<Props> = ({data: initialData, changeData}) => {
    const initialHeaders = initialData[0]
    const rows = initialData.slice(1)

    const [headers, setHeaders] = React.useState(() => initialHeaders)
    const [data, setData] = React.useState(() => rows)
    // const rerender = React.useReducer(() => ({}), {})[1]

    console.log("headers", headers)
    console.log("data", data)

    const addColumn = () => {
        const newColumn = `Column ${headers.length}`
        setHeaders(old => [...old, newColumn])
        setData(old => old.map(row => [...row, '']))
    }

    const addRow = () => {
        const newRow = headers.map(() => '')
        setData(old => [...old, newRow])
    }


    const columns: Column<unknown>[] = headers.map((column, index) => {
        return {
            id: index.toString(),
            accessorFn: (row: RowData) => row[index],
            header: column,
        }
    })

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        defaultColumn,
        debugTable: true,
        meta: {
            updateData: (rowIndex, columnId, value) => {
                changeData(rowIndex, parseInt(columnId), value)
                // Skip age index reset until after next rerender
                setData(old =>
                    old.map((row, index) => {
                        if (index === rowIndex) {
                            return {
                                ...old[rowIndex]!,
                                [columnId]: value,
                            }
                        }
                        return row
                    })
                )
            },
        },
    })

    return (
        <div className="p-2">
            <button onClick={addColumn}><p>Add Column</p></button>
            <button onClick={addRow}><p>Add Row</p></button>
            <div className="h-2"/>
            <table>
                <thead>
                <tr>
                    {table.getFlatHeaders().map(header => (
                            <th key={header.id} colSpan={header.colSpan}>
                                {header.column.columnDef.header}
                            </th>
                        )
                    )}
                </tr>
                </thead>
                <tbody>
                {table.getRowModel().rows.map(row => {
                    return (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => {
                                return (
                                    <td key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                )
                            })}
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
    )
}