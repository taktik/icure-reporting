import { isObject, isArray, groupBy, mapValues } from 'lodash'
import { utils, WorkBook, writeFile } from 'xlsx'

const groups = {
	addresses: (a: any) => a.addressType,
	telecoms: (t: any) => t.telecomType,
}

const extractKeys = function (
	dataset: Array<any>,
	prefix = ''
): { spec: any; convDataset: Array<any> } {
	return dataset.reduce(
		({ spec, convDataset }: { spec: any; convDataset: Array<any> }, r) => {
			const row = Object.keys(r).reduce((row: any, k: string) => {
				const val = r[k]

				const prefixK = prefix + k

				if (isArray(val) && val.length) {
					const grouper = (groups as any)[k]
					if (!grouper) {
						row[prefixK] = JSON.stringify(val)
						Object.assign(spec, {
							[prefixK]: { displayName: prefixK.replace(/_/g, ' ') },
						})
					} else {
						const obj = mapValues(groupBy(val, grouper), (a: Array<any>) => a[0])
						const {
							spec: subSpec,
							convDataset: [subRow],
						} = extractKeys([obj], `${prefixK}_`)
						Object.assign(row, subRow)
						Object.assign(spec, subSpec)
					}
				} else if (isObject(val)) {
					const {
						spec: subSpec,
						convDataset: [subRow],
					} = extractKeys([val], `${prefixK}_`)
					Object.assign(row, subRow)
					Object.assign(spec, subSpec)
				} else {
					row[prefixK] = val
					Object.assign(spec, { [prefixK]: { displayName: prefixK.replace(/_/g, ' ') } })
				}
				return row
			}, {})
			convDataset.push(row)
			return { spec, convDataset }
		},
		{ spec: {}, convDataset: [] }
	)
}

export function writeExcel(dataset: Array<any>, filePath: string): void {
	const { convDataset } = extractKeys(dataset)
	const sheet = utils.json_to_sheet(convDataset)
	const wb: WorkBook = utils.book_new()
	utils.book_append_sheet(wb, sheet, filePath.replace(/.+[\/\\]/, '').replace(/\.xlsx?$/, ''))
	writeFile(wb, filePath)
}
