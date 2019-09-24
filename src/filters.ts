// TODO patient merges?
// npm link /Users/simon/Documents/taktik/icc-api
import * as WebCrypto from "node-webcrypto-ossl"
import fetch from "node-fetch"
import {iccContactApi, IccCryptoXApi, IccHcpartyXApi, iccPatientApi, ServiceDto} from 'icc-api'
import {flatMap, isEqual, omit} from 'lodash'
import * as Peg from 'pegjs'

const fs = require('fs')

const LocalStorage: any = require('node-localstorage').LocalStorage
// @ts-ignore
global.localStorage = new LocalStorage('/tmp')
// @ts-ignore
global.Storage = ''

const grammar = fs.readFileSync('./pegjs', 'utf8')
const parser = Peg.generate(grammar)

const host = 'https://backendb.svc.icure.cloud/rest/v1'
const username = 'abdemo'
const password = 'knalou'
const headers = {Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`}

// @ts-ignore // todo should not have to use ts-ignore here?
let hcpartyicc = new IccHcpartyXApi(host, headers, fetch);
// @ts-ignore
const patienticc = new iccPatientApi(host, headers, fetch)
const cryptoicc = new IccCryptoXApi(host, headers, hcpartyicc, patienticc, new WebCrypto())
// @ts-ignore
const contacticc = new iccContactApi(host, headers, fetch)

const hcpartyId = "782f1bcd-9f3f-408a-af1b-cd9f3f908a98"
const privateKey = '308204bd020100300d06092a864886f70d0101010500048204a7308204a302010002820101009ad2f63357da7bb9b67b235b50f66c4968b391ba3340c4c4a697d0495512bff35f3692ffdcc867fa0602819d9fe9353f049b6c69e2dbf4a987e4d1b88b9475307c41427b33af8c0a6779a8347122f032cb801b54e2ce54e2edef2b1ae1f440a797945a4d0ab541711866ea32d096fe2da943bdd8251345fd8f50b0481e88f52e326a2cc9446d125c9643650182dbebf0272da6004a954acc21f8f47236fa7d3bbb256fb932aceb9b0fe081af27a3b476d0885905526b0e5faaa7d712536b77b05ff29a36b617a17ef611b8876346cc9ff864a295cc9ec2d5fe0efb0d94d99e5db96ea36a96d95ec63de639d243c74c773a4c350236265f71260de0fcd5fbb94b02030100010282010100878dd589b68dd06e155b52e58cc9749e0151d77193964db16fbad3dea0e1bdb633d2f0799cb0ca7899f26fd1b644d51dcbc6d8f10c73508f6e2fe57f129674d472b620a305e9d94ef2b20d977cc6fe4f3ae57b08a35bcbeeb42c072d8e4ff09bcb975448c7eb52d4d66ca4f8c0b0b2f2ff94140fbec6552d5fe161b683259ea3e95278ac83826f0674a4b0b5b6c717087abce79c73c9f6bf7832ef7337d8b07912244c30e3dc59512b8d2ab0fec288d8e561e29985e7eaaaa1e010a52ed025f5fa201c893214a42d9b17eff87752902063a1accc4eb169cd408aec4ee95e588e0bf5fccb6e945e67b965c6fb5d936c1b8cbf5e6dd6f7a9b8b4dd25f68ffcb68102818100ddc101d385681b81f527edb6dce5cb7ca9e2e7cb28fa1187933628bfbc38e9c153cd3783453a7e0ffbd2ad28ef67e879e08744d7148e83b3cb3fb7282ac03feed5d44cb7e70d014b1aef213d0c057d3d6c75653739ee22ba794c0a5f6194db84c6df3e0dddbdf57b1cc114881015f49c26eda572470dc708d2a1abc4c541671b02818100b2bbe5ab2f5d41323c8c9a6b65daf0771f416abc6c8c6b08a2bcd632e6ebba0d9efb6d99b435a3ae5b1b2b3ef450648e361bc6c480902d25b459ad120c05286ab7f91e24ecc8516ba9db086e8dabf5bb4ba97ef1c4c20a751841e472a41132145623eca0ca4fbb3025b4fb7430e0e5258afedb5017c2a0dd66cb8bcf0d172991028180345bc8049b71335d81f70587b1ac88594cfb88634daf8dc807183892dcec4b351c864ddf2ecf5ac8875afd0bb74b3f76d76ed8f037a856ac7306fe45fba21cf65582a5029f09510edcb32d93ee6cb55f75665a99a991f29d38da9d705be7fbd4e3e7fe0ce4186007cb884342c5198a01fca70bf3699775313e1a722629b5019502818006e5ab5234ccb3745dd3cb2db3cb841604b5c089aee2a84ab804f37b19602558db36b69f04ce4117bc5a4b0beddfa051c092c7d3d3663ce7c492e553d9f4e4ff614412beb8086ee3e9b51319390c56ba388c3ce2d585eb6363613f9090f63ce97dfd7ae725877820be83c264547289452e9cf117a123189412a06e2fba40979102818070faf47286b59425cb7c2f617f2b7b1b280b932f131a86b82e63c4fb240525ab40323ab902c507a4aee337f9f95b89aa9151d1ae2882bff497396e680407f5407ca154f20047017022eda8fe0438a473fb38123d36bc51bffc69e3c13fab4ecf16057529265e2c0993ca8886cc019c65e9460fe549b553fa48bb0f3ca0975e78'

async function rewriteFilter(filter: any, first: boolean, mainEntity: string = ""): Promise<any> {
	try {
		if (filter.$type === "request" && first && filter.entity && filter.filter) {
			return {
				$type: "request",
				entity: filter.entity,
				filter: await rewriteFilter(filter.filter, false, filter.entity)
			}
		} else if (filter.$type === "request") {
			if (filter.entity === "SVC") {
				const body = {filter: filter.filter}
				const servicesOutput = await contacticc.filterServicesBy(undefined, undefined, undefined, body) // TODO here and elsewhere or any
				if (mainEntity === "PAT") {
					const patientIds: string[] = await servicesToPatientIds(servicesOutput)
					return {$type: "PatientByIdsFilter", ids: patientIds}
				}
			}
			console.error("Filter not supported yet: " + filter)
			return Promise.reject()
		} else if (filter.$type !== "request") {
			if (filter.filters) { // TODO also filter.filter or other?
				let target = Object.assign({}, filter)
				target.filters = await Promise.all(filter.filters.map(async (f: any) => await rewriteFilter(f, first, mainEntity))) // TODO cleaner way ?
				return target
			} else {
				return filter
			}
		} else { // never hits this
			console.error("Failed to parse filter: " + JSON.stringify(filter))
			return Promise.reject()
		}
	} catch (e) {
		console.error('Error occurred while rewriting filter: ')
		console.error(e)
		return Promise.reject()
	}
}

async function handleFinalRequest(filter: any): Promise<any> {
	if (filter.$type === "request" && filter.entity && filter.filter) {
		if (filter.entity == 'PAT') {
			//console.log('Final filter: ' + JSON.stringify(filter.filter))
			return await patienticc.filterBy(undefined, undefined, undefined, undefined, undefined, undefined, {filter: filter.filter})
		} else {
			console.error("Entity not supported yet: " + filter.entity)
			return Promise.reject()
		}
	} else {
		console.error('Filter not valid: ' + filter)
		return {}
	}
}

async function servicesToPatientIds(servicesOutput: any): Promise<string[]> {
	try {
		const services: ServiceDto[] = servicesOutput.rows
		const extractPromises = services.map((svc: ServiceDto) => cryptoicc.extractKeysFromDelegationsForHcpHierarchy(hcpartyId, svc.contactId || "", svc.cryptedForeignKeys || {}))
		return [...new Set(flatMap(await Promise.all(extractPromises), it => it.extractedKeys))] // set to remove duplicates
		//return await patienticc.getPatients({ids: patientIds})
	} catch (error) {
		console.error('Error while converting services to patients')
		console.error(error)
		return Promise.reject()
	}
}

async function run(): Promise<boolean> {
	if (!(await tests())) return false

	try {
		//console.log(JSON.stringify(parsedInput))
		//const test = await servicesToPatientIds(servicesOutput)
		//console.log('PatientIds: ' + JSON.stringify(test))
		//const filter = {"filter":{"$type":"IntersectionFilter","filters":[{"$type":"ServiceByHcPartyTagCodeDateFilter","healthcarePartyId":"782f1bcd-9f3f-408a-af1b-cd9f3f908a98","codeCode":"T89","codeType":"ICPC"},{"$type":"ServiceByHcPartyTagCodeDateFilter","healthcarePartyId":"782f1bcd-9f3f-408a-af1b-cd9f3f908a98","tagCode":"diagnosis","tagType":"CD-ITEM"}]}}
		//console.log('test: ' + JSON.stringify(await contacticc.filterServicesBy(undefined, undefined, undefined, filter)))
		//console.log('Initial filter: ' + JSON.stringify(filter) + ', output: ')

		// console.log(JSON.stringify(parsed))
		// const output = await rewriteFilter(parsed, true, "")
		// console.log('Rewritten filter: ' + JSON.stringify(output))
		//
		// const finalResult = await handleFinalRequest(output)
		// console.log('Final result: ' + JSON.stringify(finalResult))
	} catch (e) {
		console.error('Error occurred while running main function')
		console.error(e)
	}
	return true
}

async function tests(): Promise<boolean> {
	await cryptoicc.loadKeyPairsAsTextInBrowserLocalStorage(hcpartyId, cryptoicc.utils.hex2ua(privateKey))
	if (!cryptoicc.checkPrivateKeyValidity(await hcpartyicc.getCurrentHealthcareParty())) {
		console.error('Private key validity test failed!')
		return false
	}

	const filter = {
		"$type": "request",
		"entity": "PAT",
		"filter": {
			"$type": "IntersectionFilter",
			"filters": [
				{
					"$type": "PatientByHcPartyDateOfBirthBetweenFilter",
					"healthcarePartyId": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
					"minDateOfBirth": 0,
					"maxDateOfBirth": "19740920"
				},
				{
					"$type": "request",
					"entity": "SVC",
					"filter": {
						"$type": "IntersectionFilter",
						"filters": [
							{
								"$type": "ServiceByHcPartyTagCodeDateFilter",
								"healthcarePartyId": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
								"codeCode": "T89",
								"codeType": "ICPC"
							},
							{
								"$type": "ServiceByHcPartyTagCodeDateFilter",
								"healthcarePartyId": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
								"tagCode": "diagnosis",
								"tagType": "CD-ITEM"
							}
						]
					}
				}
			]
		}
	}
	const input = "PAT[age>45y & SVC[ICPC == T89 & :CD-ITEM == diagnosis]]"
	const parsedInput = parser.parse(input)

	const p = JSON.parse(JSON.stringify(parsedInput)) // deep copy since omit mutates its inputs without telling us in the doc !!!
	const passed = isEqual(omit(p, ['filter.filters[0].maxDateOfBirth']), omit(filter, ['filter.filters[0].maxDateOfBirth']))
	if (!passed) {
		console.error('PegJS test failed!')
		return false
	}

	const output = await rewriteFilter(parsedInput, true, "")
	const finalResult = await handleFinalRequest(output)
	if (finalResult.totalSize !== 3) {
		console.error('Full test failed, totalSize=' + finalResult.totalSize + ' (should be 3)')
	}

	return true
}

run()
