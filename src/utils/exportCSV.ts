import { stringify } from 'csv-stringify/browser/esm'

export const exportCSV = (rows: Array<Array<string | number | null | undefined>>, columns: string[], filename: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    stringify(rows, {
      header: true,
      columns
    }, (err, output: string) => {
      if (err) {
        reject(err)
        return
      }

      const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${filename}.csv`)
      document.body.appendChild(link)
      link.click()

      resolve(true)
    })
  })

}