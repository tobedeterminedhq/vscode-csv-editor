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


export const TableComponent: React.FC<Props> = ({data: initialData, changeData}) => {
    const headers = initialData[0]
    const rows = initialData.slice(1)


    const [data, setData] = React.useState(() => rows)
    // const rerender = React.useReducer(() => ({}), {})[1]

    const columnHelper = createColumnHelper()

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



                                        {cell.renderValue()}
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