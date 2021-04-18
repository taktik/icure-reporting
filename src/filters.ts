import { flatMap, get, pick, uniqBy } from 'lodash'
import { format, fromUnixTime, getUnixTime, parse } from 'date-fns'

import {
	Contact,
	Patient,
	HealthElement,
	IccContactXApi,
	IccCryptoXApi,
	IccHcpartyXApi,
	IccHelementXApi,
	IccInvoiceXApi,
	IccPatientXApi,
	IccUserXApi,
	Invoice,
	PaginatedListPatient,
	Service,
} from '@icure/api'

export async function filter(
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	parsedInput: any,
	api: {
		cryptoApi: IccCryptoXApi
		userApi: IccUserXApi
		healthcarePartyApi: IccHcpartyXApi
		patientApi: IccPatientXApi
		contactApi: IccContactXApi
		healthcareElementApi: IccHelementXApi
		invoiceApi: IccInvoiceXApi
	},
	hcpartyId: string,
	debug: boolean
): Promise<PaginatedListPatient> {
	const hcpHierarchy = [hcpartyId]
	const currentUser = await api.userApi.getCurrentUser()

	let hcp
	while ((hcp = await api.healthcarePartyApi.getHealthcareParty(hcpHierarchy[0])).parentId) {
		hcpHierarchy.unshift(hcp.parentId)
	}

	const requestToFilterTypeMap = {
		SVC: 'ServiceByHcPartyTagCodeDateFilter',
		HE: 'HealthElementByHcPartyTagCodeFilter',
		INV: 'InvoiceByHcPartyCodeDateFilter',
		CTC: 'ContactByHcPartyTagCodeDateFilter',
	}

	type Reducer = {
		reducer: 'count' | 'sum' | 'min' | 'max' | 'mean' | 'd2s' | 'd2y' | 's2d' | 'select'
		params: Array<string>
	}
	const reducers = {
		count: () => async (acc?: any) => (acc === undefined ? [0] : [(await acc)[0] + 1]),
		sum: (params?: Array<string>) => async (acc?: any, x?: any) => {
			const val = params && params[0] ? get(x, params[0]) : x
			return acc === undefined ? [0] : [(await acc)[0] + val]
		},
		mean: (params?: Array<string>) => async (acc?: any, x?: any, idx?: number) => {
			const val = params && params[0] ? get(x, params[0]) : x
			return acc === undefined
				? [0]
				: [(await acc)[0] + (val - (await acc)[0]) / ((idx || 0) + 1)]
		},
		min: (params?: Array<string>) => async (acc?: any, x?: any) => {
			const val = params && params[0] ? get(x, params[0]) : x
			return acc === undefined
				? [999999999999]
				: [val < (await acc)[0] ? val : (await acc)[0]]
		},
		max: (params?: Array<string>) => async (acc?: any, x?: any) => {
			const val = params && params[0] ? get(x, params[0]) : x
			return acc === undefined
				? [-999999999999]
				: [val > (await acc)[0] ? val : (await acc)[0]]
		},
		s2d: (params?: Array<string>) => async (acc?: any, x?: any) => {
			const val = params && params[0] ? get(x, params[0]) : x
			const d = val && Number(format(fromUnixTime(val), 'yyyyMMdd'))
			return acc === undefined ? [] : (await acc).concat([d])
		},
		d2s: (params?: Array<string>) => async (acc?: any, x?: any) => {
			const val = params && params[0] ? get(x, params[0]) : x
			const d = (val && getUnixTime(parse(val.toString(), 'yyyyMMdd', 0))) || 0
			return acc === undefined ? [] : (await acc).concat([d])
		},
		d2y: (params?: Array<string>) => async (acc?: any, x?: any) => {
			const val = params && params[0] ? get(x, params[0]) : x
			const d = (val && getUnixTime(parse(val.toString(), 'yyyyMMdd', 0))) || 0
			return acc === undefined
				? []
				: (await acc).concat([(+new Date() / 1000 - d) / (365.25 * 24 * 3600)])
		},
		select: (params?: Array<string>) => async (acc?: any, x?: any) =>
			acc === undefined ? [] : (await acc).concat([params ? pick(x, params) : x]),
		share: (params?: Array<string>) => async (acc?: any, x?: any) => {
			const hcpId = currentUser.healthcarePartyId
			return acc === undefined || !currentUser || !hcpId
				? []
				: (await acc).concat([
						await api.patientApi.share(
							currentUser,
							x.id,
							hcpId,
							params || [],
							(params || []).reduce((tags, k) => {
								tags[k] = ['all']
								return tags
							}, {} as { [key: string]: Array<string> })
						),
				  ])
		},
	}

	const converters = {
		SVC: (filter: any) =>
			Object.assign(
				{},
				pick(filter, ['healthcarePartyId']),
				{ $type: requestToFilterTypeMap['SVC'] },
				{
					codeType: filter.key,
					codeCode: filter.value,
					tagType: filter.colonKey,
					tagCode: filter.colonValue,
					startValueDate:
						filter.startDate && filter.startDate.length <= 8
							? filter.startDate + '000000'
							: filter.startDate,
					endValueDate:
						filter.endDate && filter.endDate.length <= 8
							? filter.endDate + '000000'
							: filter.startDate,
				}
			),
		HE: (filter: any) =>
			Object.assign(
				{},
				pick(filter, ['healthcarePartyId']),
				{ $type: requestToFilterTypeMap['HE'] },
				{
					codeType: filter.key,
					codeNumber: filter.value,
					tagType: filter.colonKey,
					tagCode: filter.colonValue,
				}
			),
		INV: (filter: any) =>
			Object.assign(
				{},
				pick(filter, ['healthcarePartyId']),
				{ $type: requestToFilterTypeMap['INV'] },
				{
					code: filter.value,
					startInvoiceDate: filter.startDate,
					endInvoiceDate: filter.endDate,
				}
			), // TODO add zeroes?
		CTC: (filter: any) =>
			Object.assign(
				{},
				pick(filter, ['healthcarePartyId']),
				{ $type: requestToFilterTypeMap['CTC'] },
				{
					// TODO patientSecretForeignKey(s)
					codeType: filter.key,
					codeCode: filter.value,
					tagType: filter.colonKey,
					tagCode: filter.colonValue,
					startServiceValueDate:
						filter.startDate && filter.startDate.length <= 8
							? filter.startDate + '000000'
							: filter.startDate,
					endServiceValueDate:
						filter.endDate && filter.endDate.length <= 8
							? filter.endDate + '000000'
							: filter.startDate,
				}
			),
	}

	async function rewriteFilter(
		filter: any,
		first: boolean,
		mainEntity: string,
		subEntity: string
	): Promise<any> {
		try {
			if (debug) console.error('Rewriting ' + JSON.stringify(filter))
			if (!filter) {
				if (subEntity === 'PAT') {
					return {
						$type: 'PatientByHcPartyFilter',
						healthcarePartyId: hcpartyId,
					}
				} else if (subEntity === 'CTC') {
					return {
						$type: 'ContactByHcPartyTagCodeDateFilter',
						healthcarePartyId: hcpartyId,
					}
				}
			}
			if (filter.$type === 'request' && first && filter.entity) {
				return {
					$type: 'request',
					entity: filter.entity,
					filter: await rewriteFilter(filter.filter, false, filter.entity, subEntity),
					reducers: filter.reducers,
				}
			} else if (filter.$type === 'request') {
				if (filter.entity === 'SUBTRACT') {
					if (debug) console.log('Subtract')
					const left = await rewriteFilter(filter.left, first, mainEntity, subEntity)
					const right =
						filter.right.length > 1
							? {
									$type: 'UnionFilter',
									filters: await Promise.all(
										filter.right.map((f: any) =>
											rewriteFilter(f, first, mainEntity, subEntity)
										)
									),
							  }
							: await rewriteFilter(filter.right[0], first, mainEntity, subEntity)
					return { $type: 'ComplementFilter', superSet: left, subSet: right }
				}
				const rewritten = await rewriteFilter(
					filter.filter,
					first,
					mainEntity,
					filter.entity
				)
				const body = { filter: rewritten }
				try {
					if (filter.entity === 'SVC') {
						if (debug) console.error('Request SVC: ' + JSON.stringify(body))
						const servicesOutput = uniqBy(
							flatMap(
								await Promise.all(
									hcpHierarchy.map((hcpId) =>
										api.contactApi.filterServicesBy(
											undefined,
											10000,
											Object.assign({}, body, {
												filter: Object.assign({}, body.filter, {
													healthcarePartyId: hcpId,
												}),
											})
										)
									)
								),
								(pl) => pl.rows || []
							),
							(x) => x.id
						)
						if (mainEntity === 'PAT') {
							const patientIds: string[] = await servicesToPatientIds(servicesOutput)
							if (debug) console.log('Patient Ids: ' + patientIds)
							return { $type: 'PatientByIdsFilter', ids: patientIds }
						}
					} else if (filter.entity === 'HE') {
						if (debug) console.log('Request HE: ' + JSON.stringify(body))
						const helementOutput = uniqBy(
							flatMap(
								await Promise.all(
									hcpHierarchy.map((hcpId) =>
										api.healthcareElementApi.filterHealthElementsBy(
											Object.assign({}, body, {
												filter: Object.assign({}, body.filter, {
													healthcarePartyId: hcpId,
												}),
											})
										)
									)
								)
							),
							(x) => x.id
						)
						if (mainEntity === 'PAT') {
							const patientIds: string[] = await helementsToPatientIds(
								helementOutput || []
							)
							return { $type: 'PatientByIdsFilter', ids: patientIds }
						}
					} else if (filter.entity === 'INV') {
						if (debug) console.log('Request INV: ' + JSON.stringify(body))
						const invoiceOutput = uniqBy(
							flatMap(
								await Promise.all(
									hcpHierarchy.map((hcpId) =>
										api.invoiceApi.filterInvoicesBy(
											Object.assign({}, body, {
												filter: Object.assign({}, body.filter, {
													healthcarePartyId: hcpId,
												}),
											})
										)
									)
								)
							),
							(x) => x.id
						)
						if (mainEntity === 'PAT') {
							const patientIds: string[] = await invoicesToPatientIds(
								invoiceOutput || []
							)
							return { $type: 'PatientByIdsFilter', ids: patientIds }
						}
					} else if (filter.entity === 'CTC') {
						if (debug) console.log('Request CTC: ' + JSON.stringify(body))

						const contactOutput = uniqBy(
							flatMap(
								await Promise.all(
									hcpHierarchy.map((hcpId) =>
										api.contactApi.filterContactsBy(
											undefined,
											10000,
											Object.assign({}, body, {
												filter: Object.assign({}, body.filter, {
													healthcarePartyId: hcpId,
												}),
											})
										)
									)
								),
								(pl) => pl.rows || []
							),
							(x) => x.id
						)
						if (mainEntity === 'PAT') {
							const patientIds: string[] = await contactsToPatientIds(contactOutput)
							return { $type: 'PatientByIdsFilter', ids: patientIds }
						}
					}
				} catch (error) {
					console.error(
						'Error occurred while handling entity ' +
							filter.entity +
							' with body: ' +
							JSON.stringify(body)
					)
					console.error(error)
					return Promise.reject()
				}
				console.error('Filter not supported yet: ' + filter)
				return Promise.reject()
			} else if (filter.$type !== 'request') {
				if (filter.filters) {
					const target = JSON.parse(JSON.stringify(filter))
					target.filters = await Promise.all(
						filter.filters.map(async (f: any) =>
							rewriteFilter(f, first, mainEntity, subEntity)
						)
					)
					return target
				} else if (filter.subSet || filter.superSet) {
					const target = JSON.parse(JSON.stringify(filter))
					if (filter.subSet) {
						target.subSet = await rewriteFilter(
							target.subSet,
							first,
							mainEntity,
							subEntity
						)
					}
					if (filter.superSet) {
						target.superSet = await rewriteFilter(
							target.superSet,
							first,
							mainEntity,
							subEntity
						)
					}
					return target
				} else {
					// TODO maybe other conditions here
					if (filter.$type === 'PLACEHOLDER') {
						const newFilter = (converters as any)[subEntity || mainEntity](filter)
						if (debug) console.log('Leaf filter: ' + JSON.stringify(filter))
						return newFilter
					}
					if (debug) console.error('Leaf filter: ' + JSON.stringify(filter))
					return filter
				}
			} else {
				// never hits this
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
		if (debug) console.log('Final request: ' + JSON.stringify(filter))
		if (filter.$type === 'request' && filter.entity && filter.filter) {
			let res: Patient[] | HealthElement[] | Invoice[] | Contact[]
			if (filter.entity === 'PAT') {
				res =
					(
						await api.patientApi.filterByWithUser(await api.userApi.getCurrentUser(), {
							filter: filter.filter,
						})
					)?.rows || []
			} else if (filter.entity === 'HE') {
				res = await api.healthcareElementApi.filterHealthElementsBy({
					filter: filter.filter,
				})
			} else if (filter.entity === 'SVC') {
				res =
					(
						await api.contactApi.filterServicesBy(undefined, undefined, {
							filter: filter.filter,
						})
					)?.rows || []
			} else if (filter.entity === 'INV') {
				res = await api.invoiceApi.filterInvoicesBy({ filter: filter.filter })
			} else if (filter.entity === 'CTC') {
				res =
					(
						await api.contactApi.filterByWithUser(
							await api.userApi.getCurrentUser(),
							undefined,
							undefined,
							{ filter: filter.filter }
						)
					)?.rows || []
			} else {
				console.error('Entity not supported yet: ' + filter.entity)
				return Promise.reject()
			}

			if (res) {
				filter.reducers &&
					(await filter.reducers.reduce(async (p: Promise<any>, r: Reducer) => {
						await p
						const reducer = reducers[r.reducer] && reducers[r.reducer](r.params)
						if (reducer) {
							const reducedRows = await (res as Array<any>).reduce(
								reducer,
								await reducer()
							)
							res = Object.assign(res, { rows: reducedRows })
						}
					}, null))
			}
			return res
		} else {
			console.error('Filter not valid: ' + JSON.stringify(filter, null, ' '))
			return {}
		}
	}

	async function servicesToPatientIds(services: Array<Service>): Promise<string[]> {
		try {
			const extractPromises = services
				.map((svc: Service) => {
					return api.cryptoApi.extractKeysFromDelegationsForHcpHierarchy(
						hcpartyId,
						svc.contactId || '',
						svc.cryptedForeignKeys || {}
					)
				})
				.map((it) =>
					it.catch((e) => {
						console.error(
							'Skipped error while converting service to patient id (might be due to missing patient)'
						)
						console.error(e)
						return e
					})
				)
			return [
				...new Set(
					flatMap(
						(await Promise.all(extractPromises)).filter(
							(result) => !(result instanceof Error)
						),
						(it) => it.extractedKeys
					)
				),
			] // set to remove duplicates
		} catch (error) {
			console.error('Error while converting services to patient ids')
			console.error(error)
			return Promise.reject()
		}
	}

	async function helementsToPatientIds(helements: HealthElement[]): Promise<string[]> {
		try {
			const extractPromises = helements.map((he: HealthElement) =>
				api.cryptoApi.extractKeysFromDelegationsForHcpHierarchy(
					hcpartyId,
					he.id || '',
					he.cryptedForeignKeys || {}
				)
			)
			return [
				...new Set(flatMap(await Promise.all(extractPromises), (it) => it.extractedKeys)),
			]
		} catch (error) {
			console.error('Error while converting health elements to patient ids')
			console.error(error)
			return Promise.reject()
		}
	}

	async function invoicesToPatientIds(invoices: Invoice[]): Promise<string[]> {
		try {
			const extractPromises = invoices.map((inv: Invoice) =>
				api.cryptoApi.extractKeysFromDelegationsForHcpHierarchy(
					hcpartyId,
					inv.id || '',
					inv.cryptedForeignKeys || {}
				)
			)
			return [
				...new Set(flatMap(await Promise.all(extractPromises), (it) => it.extractedKeys)),
			]
		} catch (error) {
			console.error('Error while converting invoices to patient ids')
			console.error(error)
			return Promise.reject()
		}
	}

	async function contactsToPatientIds(contactsOutput: any): Promise<string[]> {
		try {
			const contacts: Contact[] = contactsOutput.rows || []
			const extractPromises = contacts.map((ctc: Contact) =>
				api.cryptoApi.extractKeysFromDelegationsForHcpHierarchy(
					hcpartyId,
					ctc.id || '',
					ctc.cryptedForeignKeys || {}
				)
			)
			return [
				...new Set(flatMap(await Promise.all(extractPromises), (it) => it.extractedKeys)),
			]
		} catch (error) {
			console.error('Error while converting contacts to patient ids')
			console.error(error)
			return Promise.reject()
		}
	}

	const treatedFilter = await rewriteFilter(parsedInput, true, '', '')
	return handleFinalRequest(treatedFilter)
}
