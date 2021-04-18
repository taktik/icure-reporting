import { isObject, isArray } from 'lodash'

export function forEachDeep<T extends { [index: string]: any } | Array<any>>(
	objOrArray: T,
	action: (obj: any, parent: { [index: string]: any } | Array<any>, idx: number) => void
): void {
	if (isArray(objOrArray)) {
		objOrArray.forEach((child, idx) => {
			action(child, objOrArray, idx)
			;(isObject(child) || isArray(child)) && forEachDeep(child, action)
		})
	} else if (isObject(objOrArray)) {
		Object.keys(objOrArray).forEach((k, idx) => {
			const child = (objOrArray as any)[k]
			action(child, objOrArray, idx)
			;(isObject(child) || isArray(child)) && forEachDeep(child, action)
		})
	}
}

export function mapDeep<T extends { [index: string]: any } | Array<any>>(
	objOrArray: T,
	map: (obj: any, parent: { [index: string]: any } | Array<any>, idx: number) => any
): T {
	if (isArray(objOrArray)) {
		return (objOrArray as Array<any>).map((child, idx) => {
			const res = map(child, objOrArray, idx)
			return isObject(res) || isArray(res) ? mapDeep(res, map) : res
		}) as T
	} else if (isObject(objOrArray)) {
		return Object.keys(objOrArray).reduce(
			(acc: { [index: string]: any }, k: string, idx: number) => {
				const child = (objOrArray as any)[k]
				const res = map(child, objOrArray, idx)
				acc[k] = isObject(res) || isArray(res) ? mapDeep(res, map) : res
				return acc
			},
			{}
		) as T
	}
	return objOrArray
}
