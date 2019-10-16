import { flatMap, pick, get } from 'lodash'
import { format, fromUnixTime, getUnixTime, parse } from 'date-fns'

import {
	ContactPaginatedList,
	HealthElementDto, IccContactXApi, IccCryptoXApi, IccHelementXApi, IccInvoiceXApi, IccPatientXApi, IccUserXApi,
	InvoiceDto,
	InvoicePaginatedList,
	PatientPaginatedList,
	ServiceDto,
	ServicePaginatedList, UserDto
} from 'icc-api'

export async function filter(parsedInput: any, api: { cryptoicc: IccCryptoXApi, usericc: IccUserXApi, patienticc: IccPatientXApi, contacticc: IccContactXApi, helementicc: IccHelementXApi, invoiceicc: IccInvoiceXApi, currentUser: UserDto | null }, hcpartyId: string, debug: boolean): Promise<PatientPaginatedList> {
	const requestToFilterTypeMap = {
		'SVC': 'ServiceByHcPartyTagCodeDateFilter',
		'HE': 'HealthElementByHcPartyTagCodeFilter',
		'INV': 'InvoiceByHcPartyCodeDateFilter'
	}

	type Reducer = { reducer: 'count' | 'sum' | 'min' | 'max' | 'mean' | 'd2s' | 'd2y' | 's2d' | 'select', params: Array<string> }
	const reducers = {
		'count': (params?: Array<string>) => async (acc?: any, x?: any) => acc === undefined ? [0] : [(await acc)[0] + 1],
		'sum': (params?: Array<string>) => async (acc?: any, x?: any) => {
			const val = (params && params[0] ? get(x, params[0]) : x)
			return acc === undefined ? [0] : [(await acc)[0] + val]
		},
		'mean': (params?: Array<string>) => async (acc?: any, x?: any, idx?: number) => {
			const val = (params && params[0] ? get(x, params[0]) : x)
			return acc === undefined ? [0] : [(await acc)[0] + (val - (await acc)[0]) / ((idx || 0) + 1)]
		},
		'min': (params?: Array<string>) => async (acc?: any, x?: any, idx?: number) => {
			const val = (params && params[0] ? get(x, params[0]) : x)
			return acc === undefined ? [999999999999] : [val < (await acc)[0] ? val : (await acc)[0]]
		},
		'max': (params?: Array<string>) => async (acc?: any, x?: any, idx?: number) => {
			const val = (params && params[0] ? get(x, params[0]) : x)
			return acc === undefined ? [-999999999999] : [val > (await acc)[0] ? val : (await acc)[0]]
		},
		's2d': (params?: Array<string>) => async (acc?: any, x?: any, idx?: number) => {
			const val = (params && params[0] ? get(x, params[0]) : x)
			const d = val && Number(format(fromUnixTime(val), 'yyyyMMdd'))
			return acc === undefined ? [] : (await acc).concat([d])
		},
		'd2s': (params?: Array<string>) => async (acc?: any, x?: any, idx?: number) => {
			const val = (params && params[0] ? get(x, params[0]) : x)
			const d = val && getUnixTime(parse(val.toString(), 'yyyyMMdd', 0)) || 0
			return acc === undefined ? [] : (await acc).concat([d])
		},
		'd2y': (params?: Array<string>) => async (acc?: any, x?: any, idx?: number) => {
			const val = (params && params[0] ? get(x, params[0]) : x)
			const d = val && getUnixTime(parse(val.toString(), 'yyyyMMdd', 0)) || 0
			return acc === undefined ? [] : (await acc).concat([(+new Date() / 1000 - d) / (365.25 * 24 * 3600)])
		},
		'select': (params?: Array<string>) => async (acc?: any, x?: any, idx?: number) => acc === undefined ? [] : (await acc).concat([params ? pick(x, params) : x]),
		'share': (params?: Array<string>) => async (acc?: any, x?: any, idx?: number) => acc === undefined || !api.currentUser ? [] : (await acc).concat([await api.patienticc.share(api.currentUser, x.id, api.currentUser.healthcarePartyId!, params!, params!.reduce((tags, k) => {
			tags[k] = ['all']
			return tags
		}, {} as { [key: string]: Array<string> }))])
	}

	const converters = {
		'SVC': (filter: any) => Object.assign({},
			pick(filter, ['healthcarePartyId']),
			{ $type: requestToFilterTypeMap['SVC'] },
			{
				codeType: filter.key,
				codeCode: filter.value,
				tagType: filter.colonKey,
				tagCode: filter.colonValue,
				startValueDate: (filter.startDate && filter.startDate.length <= 8) ? filter.startDate + '000000' : filter.startDate,
				endValueDate: (filter.endDate && filter.endDate.length <= 8) ? filter.endDate + '000000' : filter.startDate
			}),
		'HE': (filter: any) => Object.assign({},
			pick(filter, ['healthcarePartyId']),
			{ $type: requestToFilterTypeMap['HE'] },
			{ codeType: filter.key, codeNumber: filter.value, tagType: filter.colonKey, tagCode: filter.colonValue }),
		'INV': (filter: any) => Object.assign({},
			pick(filter, ['healthcarePartyId']),
			{ $type: requestToFilterTypeMap['INV'] },
			{ code: filter.value, startInvoiceDate: filter.startDate, endInvoiceDate: filter.endDate })
	}

	async function rewriteFilter(filter: any, first: boolean, mainEntity: string, subEntity: string): Promise<any> {
		try {
			if (debug) console.error('Rewriting ' + JSON.stringify(filter))
			if (filter.$type === 'request' && first && filter.entity && filter.filter) {
				return {
					$type: 'request',
					entity: filter.entity,
					filter: await rewriteFilter(filter.filter, false, filter.entity, subEntity),
					reducers: filter.reducers
				}
			} else if (filter.$type === 'request') {
				if (filter.entity === 'SUBTRACT') {
					if (debug) console.log('Subtract')
					const left = await rewriteFilter(filter.left, first, mainEntity, subEntity)
					const right = await rewriteFilter(filter.right, first, mainEntity, subEntity)
					return { $type: 'ComplementFilter', superSet: left, subSet: right }
				}
				const rewritten = await rewriteFilter(filter.filter, first, mainEntity, filter.entity || subEntity)
				const body = { filter: rewritten }
				try {
					if (filter.entity === 'SVC') {
						if (debug) console.error('Request SVC: ' + JSON.stringify(body))
						const servicesOutput = await api.contacticc.filterServicesBy(undefined, undefined, undefined, body) // TODO here and elsewhere or any
						if (mainEntity === 'PAT') {
							const patientIds: string[] = await servicesToPatientIds(servicesOutput)
							return { $type: 'PatientByIdsFilter', ids: patientIds }
						}
					} else if (filter.entity === 'HE') {
						if (debug) console.log('Request HE: ' + JSON.stringify(body))
						const helementOutput = await api.helementicc.filterBy(body)
						if (mainEntity === 'PAT') {
							const patientIds: string[] = await helementsToPatientIds(helementOutput)
							return { $type: 'PatientByIdsFilter', ids: patientIds }
						}
					} else if (filter.entity === 'INV') {
						console.error('Request INV: ' + JSON.stringify(body))
						const invoiceOutput = await api.invoiceicc.filterBy(body)
						if (mainEntity === 'PAT') {
							const patientIds: string[] = await invoicesToPatientIds(invoiceOutput)
							return { $type: 'PatientByIdsFilter', ids: patientIds }
						}
					}
				} catch (error) {
					console.error('Error occurred while handling entity ' + filter.entity + ' with body: ' + JSON.stringify(body))
					console.error(error)
					return Promise.reject()
				}
				console.error('Filter not supported yet: ' + filter)
				return Promise.reject()
			} else if (filter.$type !== 'request') {
				if (filter.filters) {
					let target = JSON.parse(JSON.stringify(filter))
					target.filters = await Promise.all(filter.filters.map(async (f: any) => rewriteFilter(f, first, mainEntity, subEntity)))
					return target
				} else if (filter.subSet || filter.superSet) {
					let target = JSON.parse(JSON.stringify(filter))
					if (filter.subSet) target.subSet = await rewriteFilter(target.subSet, first, mainEntity, subEntity)
					if (filter.superSet) target.superSet = await rewriteFilter(target.superSet, first, mainEntity, subEntity)
					return target
				} else { // TODO maybe other conditions here
					if (filter.$type === 'PLACEHOLDER') {
						// @ts-ignore
						const newFilter = converters[subEntity](filter)
						if (debug) console.log('Leaf filter: ' + JSON.stringify(filter))
						return newFilter
					}
					if (debug) console.error('Leaf filter: ' + JSON.stringify(filter))
					return filter
				}
			} else { // never hits this
				console.error('Failed to parse filter: ' + JSON.stringify(filter))
				return Promise.reject()
			}
		} catch (error) {
			console.error('Error occurred while rewriting filter: ' + JSON.stringify(filter))
			console.error(error)
			return Promise.reject()
		}
	}

	async function handleFinalRequest(filter: any): Promise<any> {
		if (filter.$type === 'request' && filter.entity && filter.filter) {
			let res: PatientPaginatedList | InvoicePaginatedList | ContactPaginatedList | ServicePaginatedList
			if (filter.entity === 'PAT') {
				res = await api.patienticc.filterByWithUser(await api.usericc.getCurrentUser(), undefined, undefined, undefined, undefined, undefined, undefined, { filter: filter.filter })
			} else {
				console.error('Entity not supported yet: ' + filter.entity)
				return Promise.reject()
			}

			if (res && res.rows) {
				filter.reducers && await filter.reducers.reduce(async (p: Promise<any>, r: Reducer) => {
					await p
					const red = reducers[r.reducer] && reducers[r.reducer](r.params)
					if (red) {
						const reducedRows = await (res.rows as Array<any>).reduce(red, await red())
						res = Object.assign(res, { rows: reducedRows })
					}
				}, null)
			}
			return res
		} else {
			console.error('Filter not valid: ' + JSON.stringify(filter, null, ' '))
			return {}
		}
	}

	async function servicesToPatientIds(servicesOutput: any): Promise<string[]> {
		try {
			const services: ServiceDto[] = servicesOutput.rows
			const extractPromises = services.map((svc: ServiceDto) => api.cryptoicc.extractKeysFromDelegationsForHcpHierarchy(hcpartyId, svc.contactId || '', svc.cryptedForeignKeys || {}))
			return [...new Set(flatMap(await Promise.all(extractPromises), it => it.extractedKeys))] // set to remove duplicates
			// return await patienticc.getPatients({ids: patientIds})
		} catch (error) {
			console.error('Error while converting services to patients')
			console.error(error)
			return Promise.reject()
		}
	}

	async function helementsToPatientIds(helements: HealthElementDto[]): Promise<string[]> {
		try {
			const extractPromises = helements.map((he: HealthElementDto) => api.cryptoicc.extractKeysFromDelegationsForHcpHierarchy(hcpartyId, he.id || '', he.cryptedForeignKeys || {}))
			return [...new Set(flatMap(await Promise.all(extractPromises), it => it.extractedKeys))] // set to remove duplicates
		} catch (error) {
			console.error('Error while converting health elements to patients')
			console.error(error)
			return Promise.reject()
		}
	}

	async function invoicesToPatientIds(invoices: InvoiceDto[]): Promise<string[]> {
		try {
			const extractPromises = invoices.map((he: InvoiceDto) => api.cryptoicc.extractKeysFromDelegationsForHcpHierarchy(hcpartyId, he.id || '', he.cryptedForeignKeys || {}))
			return [...new Set(flatMap(await Promise.all(extractPromises), it => it.extractedKeys))] // set to remove duplicates
		} catch (error) {
			console.error('Error while converting health elements to patients')
			console.error(error)
			return Promise.reject()
		}
	}

	const treatedFilter = await rewriteFilter(parsedInput, true, '', '')
	return handleFinalRequest(treatedFilter)
}
