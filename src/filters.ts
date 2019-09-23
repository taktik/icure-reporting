import * as WebCrypto from "node-webcrypto-ossl"
import fetch from "node-fetch"
import { IccCryptoXApi, IccHcpartyXApi, ServiceDto } from 'icc-api'
import {flatMap, omit, uniqBy, get} from 'lodash'
import {
	AddressDto,
	iccCalendarItemTypeApi,
	IccClassificationXApi,
	iccEntityrefApi,
	iccHcpartyApi,
	iccInsuranceApi,
	iccPatientApi,
	iccTimeTableApi,
	IccTimeTableXApi,
	PatientDto,
	UserDto
} from 'icc-api'
const LocalStorage: any = require('node-localstorage').LocalStorage
// @ts-ignore
global.localStorage = new LocalStorage('/tmp')
// @ts-ignore
global.crypto = new WebCrypto()
// @ts-ignore
global.fetch = fetch
// @ts-ignore
global.Storage = ''

const privateKey = '308204bd020100300d06092a864886f70d0101010500048204a7308204a302010002820101009ad2f63357da7bb9b67b235b50f66c4968b391ba3340c4c4a697d0495512bff35f3692ffdcc867fa0602819d9fe9353f049b6c69e2dbf4a987e4d1b88b9475307c41427b33af8c0a6779a8347122f032cb801b54e2ce54e2edef2b1ae1f440a797945a4d0ab541711866ea32d096fe2da943bdd8251345fd8f50b0481e88f52e326a2cc9446d125c9643650182dbebf0272da6004a954acc21f8f47236fa7d3bbb256fb932aceb9b0fe081af27a3b476d0885905526b0e5faaa7d712536b77b05ff29a36b617a17ef611b8876346cc9ff864a295cc9ec2d5fe0efb0d94d99e5db96ea36a96d95ec63de639d243c74c773a4c350236265f71260de0fcd5fbb94b02030100010282010100878dd589b68dd06e155b52e58cc9749e0151d77193964db16fbad3dea0e1bdb633d2f0799cb0ca7899f26fd1b644d51dcbc6d8f10c73508f6e2fe57f129674d472b620a305e9d94ef2b20d977cc6fe4f3ae57b08a35bcbeeb42c072d8e4ff09bcb975448c7eb52d4d66ca4f8c0b0b2f2ff94140fbec6552d5fe161b683259ea3e95278ac83826f0674a4b0b5b6c717087abce79c73c9f6bf7832ef7337d8b07912244c30e3dc59512b8d2ab0fec288d8e561e29985e7eaaaa1e010a52ed025f5fa201c893214a42d9b17eff87752902063a1accc4eb169cd408aec4ee95e588e0bf5fccb6e945e67b965c6fb5d936c1b8cbf5e6dd6f7a9b8b4dd25f68ffcb68102818100ddc101d385681b81f527edb6dce5cb7ca9e2e7cb28fa1187933628bfbc38e9c153cd3783453a7e0ffbd2ad28ef67e879e08744d7148e83b3cb3fb7282ac03feed5d44cb7e70d014b1aef213d0c057d3d6c75653739ee22ba794c0a5f6194db84c6df3e0dddbdf57b1cc114881015f49c26eda572470dc708d2a1abc4c541671b02818100b2bbe5ab2f5d41323c8c9a6b65daf0771f416abc6c8c6b08a2bcd632e6ebba0d9efb6d99b435a3ae5b1b2b3ef450648e361bc6c480902d25b459ad120c05286ab7f91e24ecc8516ba9db086e8dabf5bb4ba97ef1c4c20a751841e472a41132145623eca0ca4fbb3025b4fb7430e0e5258afedb5017c2a0dd66cb8bcf0d172991028180345bc8049b71335d81f70587b1ac88594cfb88634daf8dc807183892dcec4b351c864ddf2ecf5ac8875afd0bb74b3f76d76ed8f037a856ac7306fe45fba21cf65582a5029f09510edcb32d93ee6cb55f75665a99a991f29d38da9d705be7fbd4e3e7fe0ce4186007cb884342c5198a01fca70bf3699775313e1a722629b5019502818006e5ab5234ccb3745dd3cb2db3cb841604b5c089aee2a84ab804f37b19602558db36b69f04ce4117bc5a4b0beddfa051c092c7d3d3663ce7c492e553d9f4e4ff614412beb8086ee3e9b51319390c56ba388c3ce2d585eb6363613f9090f63ce97dfd7ae725877820be83c264547289452e9cf117a123189412a06e2fba40979102818070faf47286b59425cb7c2f617f2b7b1b280b932f131a86b82e63c4fb240525ab40323ab902c507a4aee337f9f95b89aa9151d1ae2882bff497396e680407f5407ca154f20047017022eda8fe0438a473fb38123d36bc51bffc69e3c13fab4ecf16057529265e2c0993ca8886cc019c65e9460fe549b553fa48bb0f3ca0975e78'


const host = 'https://backendb.svc.icure.cloud/rest/v1'
const username = 'abdemo'
const password = 'knalou'
const headers = { Authorization: `Basic ${btoa(`${username}:${password}`)}` }
let hcpartyicc = new IccHcpartyXApi(host, headers);
const cryptoicc = new IccCryptoXApi(
	host,
	headers,
	hcpartyicc,
	new iccPatientApi(host, headers)
)
const hcpartyId = "782f1bcd-9f3f-408a-af1b-cd9f3f908a98"


const input = "PAT[age>45y & SVC[ICPC == T89 & :CD-ITEM == diagnosis]]"

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

// Recursively parse the request; depending on type and presence of filters
// Returns a json representing the response, e.g. a list of patient ids
function parseFilter(filter: any): any {
	if (filter.$type === 'request') {
		if (filter.entity === 'SVC') {
			console.log(filter.filter)
			// return call to backend /contact/service/filter
		} else if (filter.entity === 'PAT') {
			const filters = filter.filter.filters
			if (filters) {
				filters.forEach((subfilter: any) => {
					if (subfilter.$type === 'request') {

					}
				})
			}
			// return call to backend /patient/filter
		}
	}
}

console.log('A')

async function servicesToPatientIds(servicesOutput: any): Promise<string[]> {
	try {
		console.log('starting...')
		const services: ServiceDto[] = servicesOutput.rows
		const extractPromises = services.map((svc: ServiceDto) => cryptoicc.extractKeysFromDelegationsForHcpHierarchy(hcpartyId, svc.contactId || "", svc.cryptedForeignKeys || {}))
		const patientIds = flatMap(await Promise.all(extractPromises), it => it.extractedKeys) // TODO remove duplicates?
		console.log('Patient ids: ' + JSON.stringify(patientIds))
		return patientIds
	} catch (error) {
		console.error('Error while converting services to patient ids')
		console.error(error)
		return Promise.reject()
	}
}

const servicesOutput = {
	"totalSize": 5,
	"pageSize": 5,
	"rows": [
		{
			"id": "2873d31a-9bf3-4920-8c09-bd664b381231",
			"contactId": "8cab0d2c-743b-4527-ac54-b63274586848",
			"secretForeignKeys": [
				"ce16fcc8-8f89-4b92-986d-9be9a1fa3a1d"
			],
			"subContactIds": [],
			"plansOfActionIds": [],
			"healthElementsIds": [],
			"cryptedForeignKeys": {
				"782f1bcd-9f3f-408a-af1b-cd9f3f908a98": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"key": "6d7e74d342b5b38f537f790ba5bd70f9a1c605e3a50466a28954e7e772318c4b3f569c94c45779428785fbf0e97330ba6ad167ef2993abc1219acd528aa8ce83320a608c65f1187a39d44109479040ed28cd31470a27db38747290f0bebc2661"
					}
				],
				"20012e1e-1d3c-4f15-812e-1e1d3c4f152d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "20012e1e-1d3c-4f15-812e-1e1d3c4f152d",
						"key": "2393f1e9319876493189eced35eda82775ef971d592247e2b0f383e18df9316befcf2043df27501b633e7f6c7acd431bbd380cc08ed3849f812f3f68249eee85691721ec0c3b2dcfda9c28b8d57e966610775f1af595845661d732a94118c5da"
					}
				],
				"d07fadeb-e084-43fc-9558-1d69810feec7": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d07fadeb-e084-43fc-9558-1d69810feec7",
						"key": "54794ec7dfbed2cc488a8dc69991c675953c76afd3c57823ff49b40100f31769221fe9ebdce8e209342fbb080c66521b2a3f9a1e30f3793387312d583cd20b964f3cc4fcdf97bcd456f7c228ddc1576e114731444689e51371f1acb0acffff79"
					}
				],
				"b018c2dc-b3e5-4563-963e-ef7796a93eba": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "b018c2dc-b3e5-4563-963e-ef7796a93eba",
						"key": "4a81abadf0b4413e4397fa75b7fb38fefd2a30fae4f967657073fcffd3ae35c1a4815d7c024d435e01f354f1f800ee1417b5d4982eacb86d59b82794e75caa48fea3684e869275b50918f4cf2d58bae22e15705829ec12e8cef97619681c15a8"
					}
				],
				"90904230-9161-4e16-9d27-0eade38f05ef": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "90904230-9161-4e16-9d27-0eade38f05ef",
						"key": "7d78b00a9a4d8ee6bcbe2fa2bb1c224aa3c6c771c9469c2c2d6059f3b1e5fdcc063451742f5559350cf57dc90df10cc58a2b4e4ef04ec380916eafdf2126f2c07cfeea814e343cb71092a9c2b0e5967d088c6274774167d7928c81e7cf0c846f"
					}
				],
				"cbd182bb-6aab-43d0-9182-bb6aab83d04d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "cbd182bb-6aab-43d0-9182-bb6aab83d04d",
						"key": "4dfd4ed29c17d24934885126f2bace3ee0f1bfb4c7d344d57f1bbaba24c2faa1a8b39db484e9d65926f31749cfb1ed5a7b1c0a298863c5a47f17494b7c31db450f0735796d8bd943efeaed57a0934799d1e946f9931e9aa322a6d24315251721"
					}
				],
				"d9f61fcd-2b3c-4e8b-9b7d-9671ec525439": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"key": "c20526880245ff52798d850ddd145d058ffd36b6cb0cabe0e400f9e29e8f69733f7a37ee4db1e5617140f07a61796d3230f246817fe50d5fc4f1be6b682f203dbe135576af4db2ecdd894120487508bded07572e23cb99756fa058eaf690bb59"
					}
				],
				"50a209e2-e204-42b5-a209-e2e20472b524": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "50a209e2-e204-42b5-a209-e2e20472b524",
						"key": "b3f33559e93a26dfe8edd2af5e24f08d27228ede2548d70325d0c263cdcd1217264c30211423d88c7c909e3271ea9e5763fdc7f7c0082a023a394cb7819a00a4f77799d501be15fa984751cbe0089fcada82c6c7f1a77869efc6f4b18f2c1a44"
					}
				],
				"951897ab-008a-4880-9897-ab008ad8801d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "951897ab-008a-4880-9897-ab008ad8801d",
						"key": "f8070223a4d0987198334eb507efd39686d9ea9ff4f29454d448616a492d37c7e9269c3a4ffc70dfe18e1977b1e26edc9df77db010eb59a9f454ba81865a99846245857b3d2659a1ecfb8cfcd1a3ffc7fd7d3ae84cb96c06b5c9f952edc5a64b"
					}
				],
				"4abee21e-5655-48ba-96cd-1e3216fdcfc5": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"key": "a1a2d22263a867d15b07b2578eb2671809714f1cdd1f033da6bbfe8022e31224cf8411e1dad9f66bf86822051ac0bc27aad4339338269ec50770493b91298795be2b1f5c2a6dc551234118fa6d6a08fc75ed0cbb657785df15602447fba23204"
					}
				],
				"0bca1859-044b-4930-90b2-87f39df63c89": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "0bca1859-044b-4930-90b2-87f39df63c89",
						"key": "b8bd79a7494bfc1d38ff70fcf8f2ad75e094f2a2219dd664f977eda50b0e9515f8ec376ee822c86a249d91d1abb57b0e85cf61fa28800c3e7a8ef3030e2ef466fdf6f288415e22d31a64b25745c1832ebbb3239d659a75f08a62b1ba53cdb265"
					}
				],
				"7ffb1d8a-2bef-4127-9c45-96676a554d87": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "7ffb1d8a-2bef-4127-9c45-96676a554d87",
						"key": "3d4759f8e89c9b5ab2de4895ecb2eece41184623f5b0a1b472186b60f66625699550fcab0923bc8ae2c4e685234df18c680caffb4882c000d429d16532f75ea9582fe193221fab476b4337fceb484dc4c32739377609a6e9cfa38ebe22651feb"
					}
				]
			},
			"delegations": {
				"782f1bcd-9f3f-408a-af1b-cd9f3f908a98": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"key": "566921406b923431379be87e8bd1eed5291d6fe34796929e82dcf2709ffaf4d0c670d4190198a9f94749000f35f5ad2281cb53ce4d01fd715af5297f877c856241b6065fa46230eb40b6eb0567c8c9a885e9c6d56cffa0e6d5eb51bd01946b38"
					}
				],
				"20012e1e-1d3c-4f15-812e-1e1d3c4f152d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "20012e1e-1d3c-4f15-812e-1e1d3c4f152d",
						"key": "7b4949b61fa9f5cd994e47e0eb497468b9000e6cd173835a399739100a2882296a4af0276b8331006c021592f5989816457747d8403b33628023c97e25ff642d0e67e13e318c732903c93f57e6665be77483bb326136ab486271c8b12ea04823"
					}
				],
				"d07fadeb-e084-43fc-9558-1d69810feec7": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d07fadeb-e084-43fc-9558-1d69810feec7",
						"key": "c747ac66601f5cb0088e7a42a7965dea160b9055a4c529d6a54eb82eb78c17140912306043220dc8b7869b55702e2b215e3bfa418b4b629bc7d00d49280a06fcda4dbe05cacb877306ad50ef2dc811d20fc1cf77906143a40f3bb43423e067c3"
					}
				],
				"b018c2dc-b3e5-4563-963e-ef7796a93eba": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "b018c2dc-b3e5-4563-963e-ef7796a93eba",
						"key": "2f43b89161e6d4505a0091153f8137e4a23cb6e917973622c6e2d3997f9743c859fa8f59573d3062cd2082e3a8326e2398e2eff69e1cfa98cf4f25b4ff249787b1558fd0d450d86aba4399c8146f11329273d61b9f4498e48d8e3b44f44ebcf5"
					}
				],
				"90904230-9161-4e16-9d27-0eade38f05ef": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "90904230-9161-4e16-9d27-0eade38f05ef",
						"key": "486832614fdea8b6d2ecc98901724375020eb5de96f1c5cda53bd479fd87e5142a492cb47e9ac53977e52698596da510ebe7f16f91122acdfcf3d400c54992e3181d8b5615ef7fa59f0d501469e2733aed697e819f93a5b0f4fb5769ca27ef4a"
					}
				],
				"cbd182bb-6aab-43d0-9182-bb6aab83d04d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "cbd182bb-6aab-43d0-9182-bb6aab83d04d",
						"key": "90293fab4e3c89eb64d607c4bb186182b5e6cadccfd83863c320e15d4cf006a6c37b28dce7b7ba3b553c8b51553962ec35b29af8ed7045e2591ce12a693f7dc04b76bbedca0f3cf4fad888dcb39975f507a93d9bbb8cec7010bd9be630353a39"
					}
				],
				"d9f61fcd-2b3c-4e8b-9b7d-9671ec525439": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"key": "8781bbc0b5dece8dfcd08c92e3d9b2b73e3787a85a4493589e3b497c150327189bd38fcc98d2e2f05f897db5f901db7a3a849937997404fdcd0737e27f06ff03dc49f2f007dd7c3891c3fd80592c1111ca8e837303cbb6634b2fb50fdc06c351"
					}
				],
				"50a209e2-e204-42b5-a209-e2e20472b524": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "50a209e2-e204-42b5-a209-e2e20472b524",
						"key": "e6a5f35ed92c0e6bc05cbe8fa6e6fef3d13194ea31c990d0ff964586c2c07d89b9d8164495cc7fbc3e06180ded5c323f4fa1941bc4baf33e73a01edee83ba85d1d5c5ccaf4d95dd77c2b367665f1b03816a096232f0a4628c689bbf5e6a75d91"
					}
				],
				"951897ab-008a-4880-9897-ab008ad8801d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "951897ab-008a-4880-9897-ab008ad8801d",
						"key": "b6ef02e141cb725faabcd698f296bf1dfe1e6601a91678283f0fae92ec99228ccf0c7e79f923ae1d9c0c5bfb2baef983e32e02c04188bea5d1ae095c8585267cd7d59ee400368b5c857f35b04824c7d3ce5f169569fa4424b5319b176431c10b"
					}
				],
				"4abee21e-5655-48ba-96cd-1e3216fdcfc5": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"key": "56c05419711768647d2bf7f219e6b0ec4b4057dfe5aa62e0fd715251ad65cb6011357597c4541c1d873ccc0687a86e41f279e732cffd7ca4d34614f8155d7da82b97e39586eb84099c4b2ec66c5ecff75ab92ad832b078ff28018c022a9f54b5"
					}
				],
				"0bca1859-044b-4930-90b2-87f39df63c89": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "0bca1859-044b-4930-90b2-87f39df63c89",
						"key": "c639e2b5f9c3e3e9037fbb0d86ca0d1d8e41a5212adbe585bbb61b964fbe897312692234fcc8932a705d2c5c270891f8a555d735c664bf48896938219d7b76a01c2ba440bbd6df5b132dad825fb453163c2b6ae513b67d7d33c9f7efe3680109"
					}
				],
				"7ffb1d8a-2bef-4127-9c45-96676a554d87": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "7ffb1d8a-2bef-4127-9c45-96676a554d87",
						"key": "b50600d15ef218d3dac127560d40989dc787b66825051d54ce1e818f700a48ecc2def4bb387488e5322c4a883472c929550e202dbecd6a0bead4aded8943d6baee0573dec0fc5df55ba93fede3674527af5d1bb51529f821be22121183c3649d"
					}
				]
			},
			"encryptionKeys": {
				"782f1bcd-9f3f-408a-af1b-cd9f3f908a98": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"key": "5af893ffd50f9f50a55a44bbfdc83348c771431fa8a3a030cf5b601d41540766a8e3a38e25623feeeafaecf70725adafe2a9a96f8ab7202d68e05353ed10ab97f20932b84663a91654b18b66177d3e6ba8f8c835c2b23dfe1b6942568645f920"
					}
				],
				"20012e1e-1d3c-4f15-812e-1e1d3c4f152d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "20012e1e-1d3c-4f15-812e-1e1d3c4f152d",
						"key": "abf0386455df1ac8e20eff3bc8c1aa392d92a9796be78ee1b2a51cf29a933f62587859db53b534f63fee69dc1248d771d0368085c007209f1d7db35153e41accc205cb7a6f0f8fd8adbea3df5b8c91ec6650174ef3905865ad7135c37c67e2b3"
					}
				],
				"d07fadeb-e084-43fc-9558-1d69810feec7": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d07fadeb-e084-43fc-9558-1d69810feec7",
						"key": "b10d027f8220d65fcf95d447e818a587bfd3e1f14a1eeecf8b5366c5767265bbee4c40fd14d60117efba8560c5a23af412f1949cd17b3b06ee3d2803491ca37db1a7664622a6fa87807f6fbc269f5c3da8cae4ce4d0e1733ffea46ece8093148"
					}
				],
				"b018c2dc-b3e5-4563-963e-ef7796a93eba": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "b018c2dc-b3e5-4563-963e-ef7796a93eba",
						"key": "8a13aa0993e3e1ed193c52a5da09cf52a2bbf77cd1c1df28acef739df8ba7bb2cf3874f9d71154f0baf203e813194b999aa86d3ababd976f8d56d22b94b8a2b5ff23313701d7942cd985f6e9e34c0f0261d41cf1dd112888cb067ad8bdc1b25b"
					}
				],
				"90904230-9161-4e16-9d27-0eade38f05ef": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "90904230-9161-4e16-9d27-0eade38f05ef",
						"key": "293fc08e75f014ced52d9eb18575743f10c4d97b9c368cef97ca567967d756900426d345d7ddc84caf6e38f8e95977f1db7d8c5c101db58322a06feee1fd50a6759895345c5954b0d5afd3e6fc765fa1dcb2e4d0537c0d04b6d0129211926a1a"
					}
				],
				"cbd182bb-6aab-43d0-9182-bb6aab83d04d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "cbd182bb-6aab-43d0-9182-bb6aab83d04d",
						"key": "7550574f45b578c35852a683bd2e3754df5ea8538299a1cc763706763a16aab837d52017373b9e7c26a935b701c5d2ef4c6821c9a72435a30433c03a57cb68fa4764d7b8ea7a629ff617e1f2949af0be9faab761ec4602ad7919bb11081c1141"
					}
				],
				"d9f61fcd-2b3c-4e8b-9b7d-9671ec525439": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"key": "f79bcdc3fdfed024463c745d7a5ecb5faeedcc90f0705aff613a58f67398ce6f168bcc54a592057c190ce6fdbdbbfc5cc5ce1d3e32b5d7ba13cfaa100f2f1dbd7684b479334d23a3f9c28fe86ba8e201ead48bb3a8aae5310fa86b7a9ab37d33"
					}
				],
				"50a209e2-e204-42b5-a209-e2e20472b524": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "50a209e2-e204-42b5-a209-e2e20472b524",
						"key": "ae896517f7163a8e12612ec58ceca098234d9994526bb8dafd2b85896c6b101fd7f41ba51d92bb716eb5097e263e233e24d2250e52e63cb37e984cc57b51f877d85d59bdb3ec4f0782f84865d049faab85960eef43c75d69bcc2ab325c7170e2"
					}
				],
				"951897ab-008a-4880-9897-ab008ad8801d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "951897ab-008a-4880-9897-ab008ad8801d",
						"key": "402026daa9f45c1713e61450a7408417d93f7cead66cc9c6234805a96850d1a81d6a69b572eef354bf18eb22bd0782f142b7e2343f0eea8612266c9b787283c6b6374746b116f2d517200bdb730122790a5d92faff83b89fb8c70b998e9cf953"
					}
				],
				"4abee21e-5655-48ba-96cd-1e3216fdcfc5": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"key": "90219a3d34ef44008f5fcdaf9bd3384ee9ec9df01bfeb07f97518b9ce30e0abbb63afd41c2f5241f958f5fede653eabea9b135ca91358018f5b076230e517af1d68fea8dea262fcced69d45fadb915458c6f954151ff7141aa5c660e31958336"
					}
				],
				"0bca1859-044b-4930-90b2-87f39df63c89": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "0bca1859-044b-4930-90b2-87f39df63c89",
						"key": "0ee16960e441490c5b29c7bdc4ce648bdcbef4e8fd67dee8675864d8caa2792300dfdc986eaa5656b488432ae4ed6ca4671614a67c27b2129d23eea5c26680161630f66a8f2446145c5f0511d20ad03aef963b727be325797c9c343b5e61c3a3"
					}
				],
				"7ffb1d8a-2bef-4127-9c45-96676a554d87": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "7ffb1d8a-2bef-4127-9c45-96676a554d87",
						"key": "48b1ba26d702252b1333ab8e387ec3fb61566358c284f3f92b91fde1fe24f98ef285a2fe9f6ae664cd72b858b92295966423d5b2497859302fb8a5b90d78b7a856a61afa40ea525657fb1e0e46f057e60279e56db7b8e8f8f2d0032921f51fca"
					}
				]
			},
			"label": "Diagnostics",
			"index": 0,
			"content": {},
			"textIndexes": {},
			"valueDate": 20190201092134,
			"created": 1549009294636,
			"modified": 1549009294636,
			"author": "ebd30407-9f33-4cd5-9999-079f334cd5e8",
			"responsible": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
			"invoicingCodes": [],
			"codes": [
				{
					"type": "ICD",
					"version": "10",
					"code": "E10",
					"disabled": false,
					"id": "ICD|E10|10"
				},
				{
					"type": "ICPC",
					"version": "2",
					"code": "T89",
					"disabled": false,
					"id": "ICPC|T89|2"
				},
				{
					"type": "BE-THESAURUS",
					"version": "3.1.0",
					"code": "10025767",
					"disabled": false,
					"id": "BE-THESAURUS|10025767|3.1.0"
				}
			],
			"tags": [
				{
					"type": "CD-ITEM",
					"code": "diagnosis",
					"disabled": false
				},
				{
					"type": "SOAP",
					"code": "Assessment",
					"disabled": false
				},
				{
					"type": "ICURE",
					"code": "DIAG",
					"disabled": false
				}
			],
			"encryptedSelf": "NyRbbCkny0V3lYKgzOJcuj9i49AXGFdIQLk3oVqFeZL4wH6PS0DF2ZbZlUNSXUY5+8QzlsPfG7nZo7tMdfZRnG+nz6vzGIKBEvP29ZV3cSU="
		},
		{
			"id": "2f96156e-92b9-418f-9c87-c20283dbf9ec",
			"contactId": "5c1254b9-d587-4dd6-90b2-812e0b9f9ad0",
			"secretForeignKeys": [
				"f69c3be4-f633-4590-9d1c-06fa9edb6844"
			],
			"subContactIds": [],
			"plansOfActionIds": [
				"2a6410d5-8e8b-4c3f-95de-9371fa06c618"
			],
			"healthElementsIds": [],
			"cryptedForeignKeys": {
				"4abee21e-5655-48ba-96cd-1e3216fdcfc5": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"key": "0d99e3fde63068e127f2c6ac334fbc16c1047e01e90e10a562dd12d054aa44ff42eb78976050e831ee967722b955b43a0e9c54634385c97a92104df447a3a213b94753ae9e2a4c2a3fa21c60bdf9497cfa4f73ce0644ed10ad922b7a2631ea5a"
					}
				],
				"334db298-9cc9-43ad-9532-b4362015d547": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "334db298-9cc9-43ad-9532-b4362015d547",
						"key": "3b6a6926aa18688acb3731b38d95da0e9130c0019750792e9ecaff512c5f6b1f6bdd84814ffe2342c468b9cf7574c9e1c344dc4dd0edce6112ffc3cd3978a5eb29734863ffdfc8feb86e6d3b4269a859d60371f7e3b759f5804ecd76569d3b55"
					}
				],
				"b018c2dc-b3e5-4563-963e-ef7796a93eba": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "b018c2dc-b3e5-4563-963e-ef7796a93eba",
						"key": "b3cecbb64f2c34cc5820b654de64ef05e7667ef84e13b8f62d3ba254ce1ef3030bf57c6f163410c6c7d573d1122ff5648edcbfc21524918e23d13b32866ed37ab586b04bc2018de9255c90de7861a63e84efc8ad99aaf8bbc6b4dd77acb09ed2"
					}
				],
				"d9f61fcd-2b3c-4e8b-9b7d-9671ec525439": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"key": "b9b9641b8a4cc17e2dd5d9e4f3fb29183d8431ac4adbc582613a0fa26f03feb895815f58490367206d2a154b97c280dc7101e41a104152141ad166cd9de5f850ac7d9068a8bc28352072a9e6fd960e30a596e2f8a0348a334e006f209c023c7e"
					}
				],
				"9e90af30-bdbd-42a1-9412-ef338d2bd97e": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "9e90af30-bdbd-42a1-9412-ef338d2bd97e",
						"key": "bbe6c82dcc2e287705adb03d8eba3375910ae36bb905e7205131366e79868989c8afd4e5bee5293231a6650b7cf138a870be88a55fd29e18fd57f2f87b534169b1f745e5abbff3b28135e3ee0df2776f9e34f1df4c86fb7a2def0754a8bf9752"
					}
				],
				"416ce1f7-83aa-4fdc-9873-2dc23400c45a": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "416ce1f7-83aa-4fdc-9873-2dc23400c45a",
						"key": "98bcc692aeffb8df09686ba53c5caf34033e2be11b6d3d647ac52d9f65e714e80c927a5766312039a83e43aa458f3f9358fda71d4550f6cf072df87a0c0b4f8e5340d84d416692a3573b3488adcbe522357fce6c6bf7d9e92e8f4a62cc28de2d"
					}
				],
				"0bca1859-044b-4930-90b2-87f39df63c89": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "0bca1859-044b-4930-90b2-87f39df63c89",
						"key": "ac5ee131d0a4fe16bdcea5bdfe7eacec01371ef49c07a9ecc3433cde25b4514a7babaefeba10f74e2ecfe51e8ed2af61b1b03da73fe27d0c3c58791fec6ee37d0af75324d8623fd42e5da13fcdd5a244d660569521818b2d1c8a1739e8238eee"
					}
				],
				"90904230-9161-4e16-9d27-0eade38f05ef": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "90904230-9161-4e16-9d27-0eade38f05ef",
						"key": "3428d97a73bf6c3e06e5447f8d8c062226d564d76ec617ddada23930df418edeabe72ff7cc4f47eb68647629d34ed8ab4bc1816fe1ce2e19b969ff95b5e845d4a678c82df19a504f84496cadc07ccfe6be11e4227dfb08d6636ec60de8029ac5"
					}
				],
				"782f1bcd-9f3f-408a-af1b-cd9f3f908a98": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"key": "2e6881aaeacdedaf7b03d571388d60c32b42d854720d903a0fe41d69f1dd28abe8a85a5eee613b90be676b6e2a8eab2f67baa845c86e1bfac57280ca34fae4cbad73aef4b9eef1209cb38ba92df80fe69447e22f2d480168e9f150b336f746a2"
					}
				],
				"a9d9ad5e-a1b3-460f-99ad-5ea1b3260f2f": [
					{
						"owner": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"delegatedTo": "a9d9ad5e-a1b3-460f-99ad-5ea1b3260f2f",
						"key": "aa5e3fa311364eed6f57796f7b70dd1dc0e21030bb7ebaf9ec0f7a0f2f1d279ce812a72b57c209b62afdd7b656bf2ef5c774ebe1d6147f464a5e32808cf2e722b40175359a724212fbe79e7c98357f95050315117d30f8da25af2a4ab58e9f83"
					}
				],
				"d07fadeb-e084-43fc-9558-1d69810feec7": [
					{
						"owner": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"delegatedTo": "d07fadeb-e084-43fc-9558-1d69810feec7",
						"key": "1010df67a750929cc17b2cbc67b79acec25514130092291946c0dd1f52b1075d730326916a8770ff3203bf856485916ed168d2721c3a5eaa9613b8d7b427d0867d46ffaf254ec534c2b9c95b727bf3f198aa17d35a8d0553a00eb7a62baa8b4e"
					}
				],
				"e9a94c9a-3df9-4a11-a94c-9a3df90a1124": [
					{
						"owner": "0bca1859-044b-4930-90b2-87f39df63c89",
						"delegatedTo": "e9a94c9a-3df9-4a11-a94c-9a3df90a1124",
						"key": "905496c0acfd3e93ff6e2a300f0b781efbdcf404a57d6d31b3f40523ca30bf274aa1756e4aa00792d6ed395e2bdf6e56d572b2504eb196d69d19d307b9f842793883c03a5764254a51065ef8df8ca13ed60be945d6f96fcd35abeb455c8a20ff"
					},
					{
						"owner": "0bca1859-044b-4930-90b2-87f39df63c89",
						"delegatedTo": "e9a94c9a-3df9-4a11-a94c-9a3df90a1124",
						"key": "638e93a506e1518a29f70782cf9bb28847555fbdf2e2040020848096537fa27876355e51c8145323d97166b020b2326f1417af89b19d71eec1214b4906cb2281f7ffea1ed2b3b452e840bd8c4dd7da26fc21f9cf7fa740e2273c0323d903c1db"
					}
				],
				"089b3d26-c7c0-4838-9b3d-26c7c02838b9": [
					{
						"owner": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"delegatedTo": "089b3d26-c7c0-4838-9b3d-26c7c02838b9",
						"key": "79aed52bf235f73b548742b2ae4048a81b5ca164ad4cfc45f39f7c9d570d6029fcd45787d58f03750f0d05b0ce67a91e1a00253819752eca8d40927fe137bbd0b84d70fee68fab34fc5a198b9b5ef6b038301dc22d15c53fb83652bcff8b72ba"
					}
				],
				"a16e1a9c-0817-4b5a-ae1a-9c0817ab5a7c": [
					{
						"owner": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"delegatedTo": "a16e1a9c-0817-4b5a-ae1a-9c0817ab5a7c",
						"key": "c0e0db9266f0d7cf8a93d1dd9e2d336fd60a5c54ff0b2bc40925553f4d97119c5e84dc028b37b298f0daded97bf8b8b047295bc019fc1c17752dc0e68c03ff85be3b7d1e225045c2d7a0624bbbc5674c43fcf94d3f84dc57ab4bc1a55b946ba8"
					}
				]
			},
			"delegations": {
				"4abee21e-5655-48ba-96cd-1e3216fdcfc5": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"key": "58cf76132f600ab026330d5431973f21f736f52ad429138ef0ba3e2089417bfde1e3e72654393b2fc29b20a61879c6c0960edeb1ff96f615818780c1976b8d25445a1d30586efb5f0884b1cd43850997c73ed3f5c19d93ad3f458f71b95283cd"
					}
				],
				"334db298-9cc9-43ad-9532-b4362015d547": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "334db298-9cc9-43ad-9532-b4362015d547",
						"key": "78ce34524d51707458f2c5a4722cb0d5c56ee4e34403a8688c396bf23c2e6c7e85846d253071566d8b10efb07258152c1d76e4c743e49eb97deed219ba45300b766162e0350c08d9e51fe5e4477a80d7c7ba92106456992040ed1eb6599d2f7f"
					}
				],
				"b018c2dc-b3e5-4563-963e-ef7796a93eba": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "b018c2dc-b3e5-4563-963e-ef7796a93eba",
						"key": "1789a9f2cce101f7841a5a0fb5730282583190dcc95fad23d3babfa432000049a242f64c1b7a55b9657cde57b9b5a304e9143f9d79c94daf92586b73153307ab3e8968dcb5b61714d702cfb41e3fac383bdd4dc9ca246611f65cc2407e694057"
					}
				],
				"d9f61fcd-2b3c-4e8b-9b7d-9671ec525439": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"key": "2775049d10396e40945903819fc0d4b5a8edf3d46825a19533636d510dc0d71d9e40aff9ce3230b80fa4f6068326f4bade1f46ec13ec5481317b0d861ca100ab39a249f809f6a2197402879d011ec64d2605e3853befe42dd344f904d9ada7e9"
					}
				],
				"9e90af30-bdbd-42a1-9412-ef338d2bd97e": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "9e90af30-bdbd-42a1-9412-ef338d2bd97e",
						"key": "6ec9f25a5a7437b3248710454ce535930e4a99eb9cf242d85d9b6c84b04f0f3ebc20a56b7ebb0d7340222c27de5593ed9e977e82e0c3793eb0274d7fd1245df2f6180d4e2d4bb716785ca944835a7b24458a17ffc675f5d93fc299cce38d1fad"
					}
				],
				"416ce1f7-83aa-4fdc-9873-2dc23400c45a": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "416ce1f7-83aa-4fdc-9873-2dc23400c45a",
						"key": "172fa117f5a1c4c1a4051c9509e4ac628d9098dff3dd804ad987e5fb565b5f85d6ab0ad04096bdc32a18d01fc70f901112aa2a7b9d6d305d7703e39cfcf8906e994534bc78d3a38fa1c7f73015a601208b4624602c455e937ae5fb26b652f860"
					}
				],
				"0bca1859-044b-4930-90b2-87f39df63c89": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "0bca1859-044b-4930-90b2-87f39df63c89",
						"key": "e43e13f5496cbd57768b83ed28a42938520880e5425dc673a93546f277b8bd163b76daf5b4e59250851c3a9df7e8334f4b0e0cf806e845bdd162347dcfce177465534315849107b4ab14a7bedb4e1ef9ba826080a01890655bd54c640b6c1f8d"
					}
				],
				"90904230-9161-4e16-9d27-0eade38f05ef": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "90904230-9161-4e16-9d27-0eade38f05ef",
						"key": "54c0d57474cd12378b24fe1d0022cb62cc304fe9a4f14d9ce82bb16106030c9ab266193a3bb6da00ebe2510c24f7d7f17dd80ba3d0fcdf8a00d0f816dd2391108f1df716da8d3a6638a5fe72b1794b947cfff6745e3a2447f4af3724e8559ceb"
					}
				],
				"782f1bcd-9f3f-408a-af1b-cd9f3f908a98": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"key": "114bb4aca82d649eea9367d886b51b8944431a90b1468230a2a770b35dc775f6bd9b58cd84661857161a56ce2377d4be2b4873959a9ab6023d19695288d9a03e7c21d5dfc7a2ef4789566c127e1f5f2f59f863bd624dc3fb5bc13991b1de2511"
					}
				],
				"a9d9ad5e-a1b3-460f-99ad-5ea1b3260f2f": [
					{
						"owner": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"delegatedTo": "a9d9ad5e-a1b3-460f-99ad-5ea1b3260f2f",
						"key": "221abd354e20c236f2f1c00fdb8d324d0920406f6638e0797b1cf5cb439ad74dc49e2c6966b35afa9616b6cae94dd40ba5668749dee719f5ac05db543fc561788031f4f3646e47324c243224186c0fca01aef9c9c9637449b492fcdb0f5520c5"
					}
				],
				"d07fadeb-e084-43fc-9558-1d69810feec7": [
					{
						"owner": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"delegatedTo": "d07fadeb-e084-43fc-9558-1d69810feec7",
						"key": "22c9d19dd23d75a07c006db8dacc71531868ac6cbcd19207ddef60c58d0181e9f676d9730430bfe69446404c6de775fb4980e794f233ddf135ee9c5b28bc7395e24c881050d25072c76ed1cf593e9d1c5f8e4946a731450844279b2e37500481"
					}
				],
				"e9a94c9a-3df9-4a11-a94c-9a3df90a1124": [
					{
						"owner": "0bca1859-044b-4930-90b2-87f39df63c89",
						"delegatedTo": "e9a94c9a-3df9-4a11-a94c-9a3df90a1124",
						"key": "df24c8f3f605860724d0f3e5e1594e2f447c1898c7df9db74fdb77daf874d81b2d868cd6f2fbf4f510ffb24347134b1badd622fef8d394a59505c015001c0af84303850176e4d69971ec56d56c68c1fd1fd47caeb97c3f41429cd916280ac76d"
					},
					{
						"owner": "0bca1859-044b-4930-90b2-87f39df63c89",
						"delegatedTo": "e9a94c9a-3df9-4a11-a94c-9a3df90a1124",
						"key": "46e90be89246b55474178ca2fe12e2950394def6bb082003069991b934ac3056df642564c7832221b0d0ba1f54117d83dac5a0e890b52f1a0820d3465d19c21e82016b9795174877ba98d5d5d17b95d6c17ec25b0ec8d3d5c104b52636665ee7"
					}
				],
				"089b3d26-c7c0-4838-9b3d-26c7c02838b9": [
					{
						"owner": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"delegatedTo": "089b3d26-c7c0-4838-9b3d-26c7c02838b9",
						"key": "eeef1fae142adf1b99de736341cd51c7e49b3a7c0e8d1888e377f8b120e4342cdea2896e6ff1c84dbc3b30c6ac9e85603de35c16dec9b20dfda8561e111ad185ed1a4001a6df093f3bf6ef8e359f2cc22eb702a0f52ea806af08bd5ec8774a9e"
					}
				],
				"a16e1a9c-0817-4b5a-ae1a-9c0817ab5a7c": [
					{
						"owner": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"delegatedTo": "a16e1a9c-0817-4b5a-ae1a-9c0817ab5a7c",
						"key": "86c214b7446cf8b6f079274807a4dc966d52d5c7cc37819fe5533f64072324bec404dfedfce9cf6e9948e453b945667f85ae11d398c3c2897af53aab9c98c30906d7e2208596618259400ddfcbaff0609bdda167401871761aff16076b8ddbd0"
					}
				]
			},
			"encryptionKeys": {},
			"label": "Diagnostics",
			"index": 17,
			"content": {},
			"textIndexes": {},
			"valueDate": 20180111182350,
			"created": 1515691463733,
			"modified": 1515691463212,
			"formId": "99fd56bc-10d9-472e-9793-b813f4ea0bea",
			"author": "ebd30407-9f33-4cd5-9999-079f334cd5e8",
			"responsible": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
			"invoicingCodes": [],
			"codes": [
				{
					"type": "BE-THESAURUS",
					"version": "3.1.0",
					"code": "10015205",
					"disabled": false,
					"id": "BE-THESAURUS|10015205|3.1.0"
				},
				{
					"type": "ICD",
					"version": "10",
					"code": "E10",
					"disabled": false,
					"id": "ICD|E10|10"
				},
				{
					"type": "ICPC",
					"version": "2",
					"code": "T89",
					"disabled": false,
					"id": "ICPC|T89|2"
				}
			],
			"tags": [
				{
					"type": "CD-ITEM",
					"version": "1",
					"code": "diagnosis",
					"disabled": false,
					"id": "CD-ITEM|diagnosis|1"
				},
				{
					"type": "SOAP",
					"version": "1",
					"code": "Assessment",
					"disabled": false,
					"id": "SOAP|Assessment|1"
				},
				{
					"type": "ICURE",
					"version": "1",
					"code": "DIAG",
					"disabled": false,
					"id": "ICURE|DIAG|1"
				}
			],
			"encryptedSelf": "/FtyvSjwd6GR9cSKsiyiFnKG6SH7OmWYZuI8CC95+4UV4Hvqz2hQe1dUBwltnRFr7iLpEwuLiocN3zV6yA9QsHMeBByhPb05Df+K7RGLy6CsDTrZVbDJyNGyvg/a0OE4+WRQpijUDfKVaCbdlozqF2XIwXJ+DXfHWiM6HAjsbIo="
		},
		{
			"id": "4e4d4027-dc6b-43f8-9004-fb8478027925",
			"contactId": "0560b706-ad9d-43ff-9db5-32669a30437a",
			"secretForeignKeys": [
				"8e2e70db-617e-42f5-98cf-3af6e468fa87"
			],
			"subContactIds": [],
			"plansOfActionIds": [
				"3e8c1c85-01d4-4f16-9a24-8e0be7faca66"
			],
			"healthElementsIds": [],
			"cryptedForeignKeys": {
				"d9f61fcd-2b3c-4e8b-9b7d-9671ec525439": [
					{
						"owner": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"delegatedTo": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"key": "ec3fdab53e3eab8a30e6bec42f79b9e881b4ad6f2b6c5d1734a5ce1869d4b69a940e9c6b4365fe982bb4a17972d6df411cd39ab1460b8c8ae3da4f911a9babacdc1f00b00d2ee94c99f53a030d9d77550e3e266de9f327a4961bcf2e53483962"
					}
				],
				"782f1bcd-9f3f-408a-af1b-cd9f3f908a98": [
					{
						"owner": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"delegatedTo": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"key": "2f419fe0783a04ccf79a2d3a64ec7ab23841ec3b98364cb0b877fe1b1175ac8afcf24e237c87f7c2c4cd37ce27ab13e734c8a297bd769be658b22bd6aaabdb0ee525c51566efe459d2212c46c490d51e8319a4d2d01f90a30a25a7ba2ac47eca"
					}
				]
			},
			"delegations": {
				"d9f61fcd-2b3c-4e8b-9b7d-9671ec525439": [
					{
						"owner": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"delegatedTo": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"key": "178b880366c1860f3e71f405d55e06f236514f8ad7a47a9967205802581f9198cfe62c231571c3a30b905c33537b945a65e85f53185659dfda64fefd7c5e8df8caef13909b99e1b75ede91c301136a7e52aa90b6739bc43a360b3623d70663f3"
					}
				],
				"782f1bcd-9f3f-408a-af1b-cd9f3f908a98": [
					{
						"owner": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"delegatedTo": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"key": "e7debe577db539ee9f7470750ed2d704bece82fe9886052decddccabceb275ada609e62b14be8a1dcb99b884d5092d52bbc6b959f2d20455515ca13cd6847439a1c8935e122e0829f0872653e43140ecab33e10ab7f7aa1d409bcc01d60de5ae"
					}
				]
			},
			"encryptionKeys": {},
			"label": "Diagnostics",
			"index": 8,
			"content": {
				"fr": {
					"stringValue": "diabète instable"
				},
				"nl": {
					"stringValue": "instabiele diabetes"
				}
			},
			"textIndexes": {},
			"valueDate": 20180129185459,
			"created": 1517248505001,
			"modified": 1517248504788,
			"formId": "4bcc23f9-04ee-42f8-9732-d764a0f4d22a",
			"author": "e1fa8e15-18d1-4743-9998-1518d1174359",
			"responsible": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
			"invoicingCodes": [],
			"codes": [
				{
					"type": "ICD",
					"version": "10",
					"code": "E10",
					"disabled": false,
					"id": "ICD|E10|10"
				},
				{
					"type": "ICPC",
					"version": "2",
					"code": "T89",
					"disabled": false,
					"id": "ICPC|T89|2"
				},
				{
					"type": "BE-THESAURUS",
					"version": "3.1.0",
					"code": "10025705",
					"disabled": false,
					"id": "BE-THESAURUS|10025705|3.1.0"
				}
			],
			"tags": [
				{
					"type": "CD-ITEM",
					"version": "1",
					"code": "diagnosis",
					"disabled": false,
					"id": "CD-ITEM|diagnosis|1"
				},
				{
					"type": "SOAP",
					"version": "1",
					"code": "Assessment",
					"disabled": false,
					"id": "SOAP|Assessment|1"
				},
				{
					"type": "ICURE",
					"version": "1",
					"code": "DIAG",
					"disabled": false,
					"id": "ICURE|DIAG|1"
				}
			]
		},
		{
			"id": "7edf45b2-c4a4-449b-9f44-bd60691b0719",
			"contactId": "46526001-2819-4e92-9bda-3ded27273902",
			"secretForeignKeys": [
				"a2274f47-c954-4107-9d77-0c1a3492514d"
			],
			"subContactIds": [],
			"plansOfActionIds": [],
			"healthElementsIds": [],
			"cryptedForeignKeys": {
				"782f1bcd-9f3f-408a-af1b-cd9f3f908a98": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"key": "660c7847aeb5c0c0f9037239af960499c635836da0926b5cb39576404a5fdeaec62299023b1ba59fb2733f21dc71c93712f92ebea6ef18e50a15ffae91d825e1f56716969353e3c2d6387237e89581c8ff2fff55bf5056127945f72a80face54"
					}
				],
				"20012e1e-1d3c-4f15-812e-1e1d3c4f152d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "20012e1e-1d3c-4f15-812e-1e1d3c4f152d",
						"key": "fdeee0cff8d8afcefc4514158249a6b6c417dc83f93f1d49614cb2e01b4f07796e162969b838f8a33bc0fc8f8a9ddb7bbba1ccdfa37fdb531e37660dd9edaca21641ce402828f76cea4d0f73dae3287b988a0dcbae33e536f4aaf0971a33b944"
					}
				],
				"d07fadeb-e084-43fc-9558-1d69810feec7": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d07fadeb-e084-43fc-9558-1d69810feec7",
						"key": "de56b7cef3260051ace4b7618874d18e97e56dde4e2aa2c99b4ad5b2cb24fa39a30429a3c5fee34307baaef91372e71b305017c8065ae050c5e8191bd9dd576a41b0fbbfdf587a684d9677f94ba7730ad1459bd2a69ab5fe9e4a71e8965c0903"
					}
				],
				"b018c2dc-b3e5-4563-963e-ef7796a93eba": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "b018c2dc-b3e5-4563-963e-ef7796a93eba",
						"key": "768ff4bba14e19367b468c9254abd26bbdb63ab85b8b38cda721565491a16c1a0569670bcc33f8f13dcf8e65801fbf1c172bda4889c868629bfac1b1e6f94deacb5065ebfe37e70adbb11ee9f019dc8b3be64757cc30e2f3ecaaae7229ca4967"
					}
				],
				"90904230-9161-4e16-9d27-0eade38f05ef": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "90904230-9161-4e16-9d27-0eade38f05ef",
						"key": "e02259992defcc8ae4df651957ea2a1c41a7664c9051ff98c67ab17839a016f7241dc9f464732bb364d284f1a71fdaf67c01db5991b2ec75b4b87931fb0d98b9754cb9d0bb3c80f8f25fb8b45e893799183a67ae3821baf2bcb01c65b16f3c23"
					}
				],
				"cbd182bb-6aab-43d0-9182-bb6aab83d04d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "cbd182bb-6aab-43d0-9182-bb6aab83d04d",
						"key": "8060a3c5dc00a587ecd328612baa3953ae04038ca46b31c69d083362fea21dffe3a7eb9eef1091e347f4f9571625b128df9c34abe0b306289808e989f841694d30e13b2cbe7679437bdb467b5760caa54cc98fb2cf76e4eb6af330d8c814bf40"
					}
				],
				"d9f61fcd-2b3c-4e8b-9b7d-9671ec525439": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"key": "08717ac91489ef32b9ded7f09c440decb1f9c1ff972d6a8af602ad8e2d856ee73158865e72f919525292a8ad5ccbeefb816873d1bf85bf7b908e296b9848bcc0ff0107d202af61132a02f31e2307813d3e648ee6b036a19900823543c5ec818b"
					}
				],
				"50a209e2-e204-42b5-a209-e2e20472b524": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "50a209e2-e204-42b5-a209-e2e20472b524",
						"key": "548c40b70ac3e8913c3cdf50f94f1d25d96e633bf550bd578c96bdb59be4b1a37863d6c4dde58371f4d9fb6903b2d302f4e5e970d882e2360cd7c96b01d6053b2c104261cf4ccab2f2aa7f97327ac9fec12483c6eb1fae07bbb8dfa66e925372"
					}
				],
				"951897ab-008a-4880-9897-ab008ad8801d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "951897ab-008a-4880-9897-ab008ad8801d",
						"key": "6c097679e64d27bffaefa7228cdd0f69d04c813128c024bd0b6a4d9d9ccd1571ebd823c342468d75ed1a06626d7f590bd21fe58b39665bb1324ef672e25f755fc4a0e8b04b527001cf2d5422b65e5eeb598f94d2767ddb07d5616f57479fc3f5"
					}
				],
				"4abee21e-5655-48ba-96cd-1e3216fdcfc5": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"key": "e07a388a6a78733f22b0815cc27de95a74cadaa3fcc4015ee49567964c9b7b62809b6495e4fef864700877b6178dd1f9134094baaceca9e69d83b4c1a7429c5c042a2ea24cc48255151eb754eff76a2f3810228e604d0fc52bfcaa515d240db7"
					}
				],
				"0bca1859-044b-4930-90b2-87f39df63c89": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "0bca1859-044b-4930-90b2-87f39df63c89",
						"key": "1e79c31c4ee31f76630c5ff9faaadfa70ff6f991cc9fb0bef5b6267ced2abc972de557e246b613b5c412386ab35a5c187b40478d204cae1b9710a8f5e927606ae56d85ff950e8936c928b502b06c6abbbb97e9dc7a2ecb4b9ca303221a629e0e"
					}
				],
				"7ffb1d8a-2bef-4127-9c45-96676a554d87": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "7ffb1d8a-2bef-4127-9c45-96676a554d87",
						"key": "c5463640bdc90f74e1d313be3d11f107e2c4b8201c03822b94dcc9acb265fcbc02cb5c788d3f47c79855d9c1cb3c907ad37db95814714f8db290aaa3c47839f6956dc0e069a91f7d44d75619679b647ac1ad2a989ee8aac6cf6af22c24748aff"
					}
				]
			},
			"delegations": {
				"782f1bcd-9f3f-408a-af1b-cd9f3f908a98": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"key": "2cca3073676431abbf6dc7bc9d08e1e9fc9bce6573f6b15ca2fd62ee51f8245eb20a14007e0c2b1ed3ccc12857d61a84ae06a5ef52ff9fc70809d93e9068994e29241b7cfb9dc59fb902d68496c8b73960c2ee3bb0695d2d2e6c49ee06366611"
					}
				],
				"20012e1e-1d3c-4f15-812e-1e1d3c4f152d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "20012e1e-1d3c-4f15-812e-1e1d3c4f152d",
						"key": "ef7bedcd0d6605b7e5cedc0b94be5fdc6a3a8c676ba230f9b82599565e769f5a9c04128d1b50afca570572c5c6d3e60953b8e70f8d3562773805c13c981bc3d1e75d40df633a0fadd1c722a4f80758076eaa47f0230c9fae119207e23a4f0480"
					}
				],
				"d07fadeb-e084-43fc-9558-1d69810feec7": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d07fadeb-e084-43fc-9558-1d69810feec7",
						"key": "c03be0f59fb686b48175b47479f90b98de13b72142b40ec7bd24cc873f23dde5136e3c288f89dc3ca4acda4d17da491177ebf591e9f9fb11da306264188d11927156882af5b5b9e5f44681bb15e32e28d255524f977f21fcf6c644d0a842c6bd"
					}
				],
				"b018c2dc-b3e5-4563-963e-ef7796a93eba": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "b018c2dc-b3e5-4563-963e-ef7796a93eba",
						"key": "20940d99c4779f4344c6773470770525a7a1896e1e588475663e376402eb8d863861dbde9eded2f51e3096beb6d81b39150398fbd50af071c4c915e4f43a88312d370b17024e12bac177bc458a2500b204cfa40940968b9a20b1073d4e11d7c8"
					}
				],
				"90904230-9161-4e16-9d27-0eade38f05ef": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "90904230-9161-4e16-9d27-0eade38f05ef",
						"key": "1cbff271bb7ccc5c15939ab316bb1dea11c0ed3c258d2f38638a6045c985cb7586adb976dca5369dd04f4a275181acc6d25003db28562b2ecfd710939d3a80000469c479d5dcb68803d1b7ca2b176f7220f04916190fee0bc801e75d50419207"
					}
				],
				"cbd182bb-6aab-43d0-9182-bb6aab83d04d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "cbd182bb-6aab-43d0-9182-bb6aab83d04d",
						"key": "683ba1ad560ab301cf6ba6a353ca7060e41cdce04f7a655625db5b23365f88e9946646d06cf29d8b266b372a893f92950abac047f88e6e48cebbc93a5594be982bc71738dcf757396a06c0476e0ccd7a3f73dc4b4c29e4b147dce322b0aa2e6c"
					}
				],
				"d9f61fcd-2b3c-4e8b-9b7d-9671ec525439": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"key": "0f39f40df5b53c917156458bbac8a355ef099eacb64249433de82eb5eca8b1a4c41792ae81f371cd3c1807fb4c763f09ec75eaa96b251726e915c12106169476916a840dfdc2fbd9389d2bd9e5bf2ec2c57bcf203a2a3a120cc68e7d2bf4af87"
					}
				],
				"50a209e2-e204-42b5-a209-e2e20472b524": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "50a209e2-e204-42b5-a209-e2e20472b524",
						"key": "bbc6b0b38e9af5584c35586e5b7674e8da0e4b025d995d52303b0786e1f086d40bba74a76d2f72b12c22fac9ee099aba40f8acf804c10c9ff60a1068c8459dde33961713764e577fefe18747c3c2df78138531320f5237cf581465b1ff863ad2"
					}
				],
				"951897ab-008a-4880-9897-ab008ad8801d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "951897ab-008a-4880-9897-ab008ad8801d",
						"key": "0e4dabb45330db6b5558d956e1595ed851ac2703fcda8a5792e8a7b92b94a257dca57d0c9e9d88e95029dc67f0f2d63ca5e69b2adebec78281001bee333034dd42ad5bdb2ca062c36f449f0906a3b0c7073a9a98bdaa57dfca631edfcc65d13b"
					}
				],
				"4abee21e-5655-48ba-96cd-1e3216fdcfc5": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"key": "45bbe37f7ea1681ae4efb950d45d38c5ab65410ae4975439aa17e88137c71b99a26b8a364533938f1570429b7f1aa840bc64c4aadcd6be2b234cc14ff553ccd3f78a0d1f9f8638f0636d099a437108a9248c832b5cc2bfdfa34eaaeda29dc352"
					}
				],
				"0bca1859-044b-4930-90b2-87f39df63c89": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "0bca1859-044b-4930-90b2-87f39df63c89",
						"key": "398f000ef2157ae07abf5b5bdb51f19cea07f64987ba00327884f7d3b90f03381c6cb43a3c594bf54b8a5b63d39d20d99ae282576b44fc9e6e7ad8e75db3159c21fbef36c17f4f992ccee88da5ad4daeb75da431c4a7565556ae6aa9cf41530d"
					}
				],
				"7ffb1d8a-2bef-4127-9c45-96676a554d87": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "7ffb1d8a-2bef-4127-9c45-96676a554d87",
						"key": "a67fd1de74c82fda97ca6344d7b323263683886a67588e1a971c7168bbb8b65704bfa8fc4c1c71464a5039d4e4e9ec143c68ea8c6d17e09df5752719d42866187ac061247d2dcb04c0c9e87ab19bebbaad00fa43ddd4815ae1bc03c1760e89fe"
					}
				]
			},
			"encryptionKeys": {
				"782f1bcd-9f3f-408a-af1b-cd9f3f908a98": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"key": "c052752a9debc175fadd5ed9e498507d9a258048a89dd4b35ba3b1441c2e42d107a04c247d7a9feca2a3ee9093b1cdfe84c84d41ceecaf8a749773134b57e4a2d1f8ea271e55b821607893711789c244a2d28ed950432581a2a39300e1d06c18"
					}
				],
				"20012e1e-1d3c-4f15-812e-1e1d3c4f152d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "20012e1e-1d3c-4f15-812e-1e1d3c4f152d",
						"key": "847fd5bd86256a01d39aa39c2f3b5de25fdec7c592acb01e1c14b7f5591b27a2912508b8edd0b4139d133fc0c930d1e4edb53b672cac4f7f182f11797603fd7c5a778f47ff412ff3389945228090a4bc1559af47dbcc66aca1255c114d729d65"
					}
				],
				"d07fadeb-e084-43fc-9558-1d69810feec7": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d07fadeb-e084-43fc-9558-1d69810feec7",
						"key": "db2d0521e971b17ab0ec28763147fa74ee7860d25cb1e34fb15d29bc100c621058438a6271f6dfe97993133cb4f07ad6171b70e44f259b2e3035c644eca0b38c20c5a5f43877775fd808eff8d4506e72f1792950e427536c769d5af25f64fb2e"
					}
				],
				"b018c2dc-b3e5-4563-963e-ef7796a93eba": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "b018c2dc-b3e5-4563-963e-ef7796a93eba",
						"key": "0164ea708e6e1b9b4171b27c2bb0db064c8639b4620919d216dfd46d9f90872bc4e47ab4480e128f09e4fd6fe26e10552e8c670a2ff63eaeb3d4656ca95f2f25cd78b847a3588b6eae05bb0fe5c5cbebf6a24316474e5083e169f4e5a63f5adb"
					}
				],
				"90904230-9161-4e16-9d27-0eade38f05ef": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "90904230-9161-4e16-9d27-0eade38f05ef",
						"key": "0abe0793662b96dcf3806d5229baa22772e3066a1232bcb4f2b215a62f7dc85cfdfb266548536df926ef983f1ed502b90a6cf91f21f64cae5b0f9c496998138352141b4fc2d0b9c61e1ee94e69cf7ce684d1db9bd0b9f75b5a10f59c90a6a311"
					}
				],
				"cbd182bb-6aab-43d0-9182-bb6aab83d04d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "cbd182bb-6aab-43d0-9182-bb6aab83d04d",
						"key": "2e0830da9e018d9a906dc598e1b481ccda784bd45d0615e4bccf07c68a33da54f0ae77f797053c141bb1d81a064d1dfe35f9f64743a0feca5f47765a44c50795d644d85c08c7e803531d108e422203e3605f86133d012ac8a80632a8bb451b71"
					}
				],
				"d9f61fcd-2b3c-4e8b-9b7d-9671ec525439": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "d9f61fcd-2b3c-4e8b-9b7d-9671ec525439",
						"key": "d110419c4d3085a4e94ec72a696ef2bfc0dd284f4aa5f64281bc979e1bb7d8989ccbf4fee30b02ef13173dd03dfa15908c37b0f80c1ec8bf0a0fcf20ef3fa9bac968490b8e00573f98a8e0026b7bb6a4539e7d35e8c815038fd5131601642cf5"
					}
				],
				"50a209e2-e204-42b5-a209-e2e20472b524": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "50a209e2-e204-42b5-a209-e2e20472b524",
						"key": "724b1fc8cf1d9928f79bc47147928234a3f9df0dcebade90845e9a207d9c590c1ae5c120177cd138278660ac5e34b4f6d04a2dae36e4add20077761868e74b7d48645c4c0f2646f564dd365cfb850eee7caf8e55d4d26ed243248bce405fd0bf"
					}
				],
				"951897ab-008a-4880-9897-ab008ad8801d": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "951897ab-008a-4880-9897-ab008ad8801d",
						"key": "c4ad1e2d157abcd68c07ec089fd859f6719b9f3dcfb46fe2d40f7107347342dab68f5a17a8514fec4644561944738249cf522bed909d036326c0c0e9e2c37e370b066f14b32cc2831c4178728b606fa4e0a52941f42836f9b9b135883b8eb214"
					}
				],
				"4abee21e-5655-48ba-96cd-1e3216fdcfc5": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "4abee21e-5655-48ba-96cd-1e3216fdcfc5",
						"key": "52c8ef502371d6070acb203eddf32d40325d369bae0492703c42174910ee42fc9b957d82bbf92bad04e2c990f0af0128637399d508bc34740546ebfcf03264c5f9d60db2e3e1bf4c618a9dde9079263474ec434db318fb3c4138d200f2498970"
					}
				],
				"0bca1859-044b-4930-90b2-87f39df63c89": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "0bca1859-044b-4930-90b2-87f39df63c89",
						"key": "a1c584eec5639f95b97082c54cca84e4180a46a33ed538bb3f87f40a2dfc275a9bd1492a2c5ed4aaefab24bbfffd31c3b167c1ae43457b5d62fdfcc58e370262b533f8b3785183254140ba432a244e66cc897eabb5d54d9c8c4c09f2e6a2eb9b"
					}
				],
				"7ffb1d8a-2bef-4127-9c45-96676a554d87": [
					{
						"owner": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
						"delegatedTo": "7ffb1d8a-2bef-4127-9c45-96676a554d87",
						"key": "f9c651f3fe51980a29bb438b60c73fde5178805f65b887a954693c6d2badfc7ccbc8ce8b0630ba154c1c9c871c7324d30fe47ac7d695e6032779405e12742704be54a1d8ee9dc2b2e23730d24c9832de1ace3d2de0734c9a933288e5d8a51fc8"
					}
				]
			},
			"label": "Diagnostics",
			"index": 0,
			"content": {},
			"textIndexes": {},
			"valueDate": 20190201100445,
			"created": 1549011885386,
			"modified": 1549011885386,
			"author": "ebd30407-9f33-4cd5-9999-079f334cd5e8",
			"responsible": "782f1bcd-9f3f-408a-af1b-cd9f3f908a98",
			"invoicingCodes": [],
			"codes": [
				{
					"type": "ICD",
					"version": "10",
					"code": "E10",
					"disabled": false,
					"id": "ICD|E10|10"
				},
				{
					"type": "ICPC",
					"version": "2",
					"code": "T89",
					"disabled": false,
					"id": "ICPC|T89|2"
				},
				{
					"type": "BE-THESAURUS",
					"version": "3.1.0",
					"code": "10025767",
					"disabled": false,
					"id": "BE-THESAURUS|10025767|3.1.0"
				}
			],
			"tags": [
				{
					"type": "CD-ITEM",
					"code": "diagnosis",
					"disabled": false
				},
				{
					"type": "SOAP",
					"code": "Assessment",
					"disabled": false
				},
				{
					"type": "ICURE",
					"code": "DIAG",
					"disabled": false
				}
			],
			"encryptedSelf": "PIF8Op+HYM1KeZa7mq9S9wlUin1xKi4nrXyUfsBmKYdi+2buUnwMCxDixeJLgMWBnk9MJ1TrGjxho6z21txlzQ0eQYjPTSNWu9buahlNIT4="
		}
	]
}

async function run(): Promise<boolean> {
	await cryptoicc.loadKeyPairsAsTextInBrowserLocalStorage(hcpartyId, cryptoicc.utils.hex2ua(privateKey))
	if (!cryptoicc.checkPrivateKeyValidity(await hcpartyicc.getCurrentHealthcareParty())) {
		return false
	}

	try {
		const test = await servicesToPatientIds(servicesOutput)
		console.log(test)
		console.log("end")
	} catch (e) {
		console.log(e)
	}

	return true
}

run()
