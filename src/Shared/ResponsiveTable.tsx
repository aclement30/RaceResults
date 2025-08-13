import { Table, useMatches } from '@mantine/core'
import {
  Children, cloneElement,
  isValidElement, type ReactElement,
  useMemo
} from 'react'

type ResponsiveTableProps = {
  stickyColumnHeaders: ReactElement<typeof Table.Tr>
  scrollableColumnHeaders: ReactElement<typeof Table.Tr>
  children: ReactElement<typeof Table.Tr>[]
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
                                                                  stickyColumnHeaders: leftColumns,
                                                                  scrollableColumnHeaders: rightColumns,
                                                                  children
                                                                }) => {
  const tableWrapperStyles = useMatches({
    base: { width: '100%' },
    sm: { width: 'auto' },
  })

  const stickyColumnsCount = ( leftColumns.props.children as ReactElement<typeof Table.Th>[] ).filter(e => isValidElement(e)).length
  const scrollableColumnsCount = ( rightColumns.props.children as ReactElement<typeof Table.Th>[] ).filter(e => isValidElement(e)).length

  const [leftTableRows, rightTableRows] = useMemo(() => {
    const leftTableRows: ReactElement[] = []
    const rightTableRows: ReactElement[] = []

    Children.toArray(children).map((tr) => {
      if (isValidElement(tr)) {
        const leftChildren: ReactElement[] = []
        const rightChildren: ReactElement[] = []

        Children.toArray(( tr.props as any ).children).forEach((td, index) => {
          if (index < stickyColumnsCount) {
            leftChildren.push(cloneElement(td as ReactElement))
          } else {
            rightChildren.push(cloneElement(td as ReactElement))
          }
        })

        const leftRow = cloneElement(tr, ( tr.props as any ), ...leftChildren)
        const rightRow = cloneElement(tr, { ...( tr.props as any ), children: rightChildren })

        leftTableRows.push(leftRow)
        rightTableRows.push(rightRow)
      }
    })

    return [leftTableRows, rightTableRows]
  }, [children, leftColumns, rightColumns])

  return <div style={{
    display: 'flex',
    flexDirection: 'row',
    overflowX: 'auto',
    position: 'relative',
  }}>
    <div style={{
      position: 'sticky',
      left: 0,
      flex: scrollableColumnsCount > 0 ? '0 0 auto' : '1 1 auto',
      display: 'flex',
      backgroundColor: 'white', ...tableWrapperStyles
    }}>
      <Table withTableBorder>
        <Table.Thead>
          {leftColumns}
        </Table.Thead>
        <Table.Tbody>{leftTableRows}</Table.Tbody>
      </Table>
    </div>

    {scrollableColumnsCount > 0 && (
      <div style={{ flex: '1 1 auto' }} className="mantine-visible-from-sm">
        <Table withColumnBorders withTableBorder>
          <Table.Thead>
            {rightColumns}
          </Table.Thead>
          <Table.Tbody>{rightTableRows}</Table.Tbody>
        </Table>
      </div>
    )}
  </div>
}