import {
	IccContactXApi,
	IccCryptoXApi,
	IccHcpartyXApi,
	IccPatientXApi,
	IccHelementXApi,
	iccPatientApi,
	IccUserXApi,
	IccInvoiceXApi, IccDocumentXApi, IccClassificationXApi, iccEntityrefApi
} from 'icc-api'
import fetch from 'node-fetch'
import * as WebCrypto from 'node-webcrypto-ossl'

export class Api {
	private _entityreficc: iccEntityrefApi
	private _usericc: IccUserXApi
	private _hcpartyicc: IccHcpartyXApi
	private _cryptoicc: IccCryptoXApi
	private _contacticc: IccContactXApi
	private _helementicc: IccHelementXApi
	private _invoiceicc: IccInvoiceXApi
	private _documenticc: IccDocumentXApi
	private _classificationicc: IccClassificationXApi
	private _patienticc: IccPatientXApi

	constructor(host: string,
				headers: { [key: string]: string },
				fetchImpl: (input: RequestInfo, init?: RequestInit) => Promise<Response>
	) {
		this._entityreficc = new iccEntityrefApi(host, headers, fetch as any)
		this._usericc = new IccUserXApi(host, headers, fetch as any)
		this._hcpartyicc = new IccHcpartyXApi(host, headers, fetch as any)
		this._cryptoicc = new IccCryptoXApi(host, headers, this._hcpartyicc, new iccPatientApi(host, headers, fetch as any), new WebCrypto())
		this._contacticc = new IccContactXApi(host, headers, this._cryptoicc, fetch as any)
		this._invoiceicc = new IccInvoiceXApi(host, headers, this._cryptoicc, this._entityreficc, fetch as any)
		this._documenticc = new IccDocumentXApi(host, headers, this._cryptoicc, fetch as any)
		this._helementicc = new IccHelementXApi(host, headers, this._cryptoicc, fetch as any)
		this._classificationicc = new IccClassificationXApi(host, headers, this._cryptoicc, fetch as any)
		this._patienticc = new IccPatientXApi(host, headers, this._cryptoicc, this._contacticc, this._helementicc, this._invoiceicc, this._documenticc, this._hcpartyicc, this._classificationicc, ['note'], fetch as any)
	}

	get hcpartyicc(): IccHcpartyXApi {
		return this._hcpartyicc
	}

	get patienticc(): IccPatientXApi {
		return this._patienticc
	}

	get cryptoicc(): IccCryptoXApi {
		return this._cryptoicc
	}

	get contacticc(): IccContactXApi {
		return this._contacticc
	}

	get helementicc(): IccHelementXApi {
		return this._helementicc
	}

	get usericc(): IccUserXApi {
		return this._usericc
	}

	get invoiceicc(): IccInvoiceXApi {
		return this._invoiceicc
	}

	get documenticc(): IccDocumentXApi {
		return this._documenticc
	}

	get classificationicc(): IccClassificationXApi {
		return this._classificationicc
	}

	get entityreficc(): iccEntityrefApi {
		return this._entityreficc
	}
}
