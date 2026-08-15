import { PayUniService } from "./crypto";

export type PayUniCredentials = {
	merchantId: string;
	hashKey: string;
	hashIV: string;
	apiUrl: string;
};

export type FormPostResult = {
	type: "form_post";
	formData: {
		apiUrl: string;
		MerID: string;
		Version: string;
		EncryptInfo: string;
		HashInfo: string;
	};
	gatewaySessionId: string;
};

export class PayUniOneTimeGateway {
	readonly type = "payuni" as const;
	private service: PayUniService;

	constructor(credentials: PayUniCredentials) {
		this.service = new PayUniService(credentials);
	}

	createPaymentSession(params: {
		orderNo: string;
		amount: number;
		productTitle: string;
		customerEmail?: string;
		baseUrl: string;
	}): FormPostResult {
		const formData = this.service.createFormData({
			MerTradeNo: params.orderNo,
			TradeAmt: Math.round(params.amount),
			ProdDesc: params.productTitle.substring(0, 100),
			ReturnURL: `${params.baseUrl}/api/payuni/return`,
			NotifyURL: `${params.baseUrl}/api/payuni/notify`,
			...(params.customerEmail ? { UsrMail: params.customerEmail } : {}),
		});

		return {
			type: "form_post",
			formData: {
				apiUrl: this.service.getApiUrl(),
				MerID: formData.MerID,
				Version: formData.Version,
				EncryptInfo: formData.EncryptInfo,
				HashInfo: formData.HashInfo,
			},
			gatewaySessionId: params.orderNo,
		};
	}

	verifyNotify(encryptInfo: string, hashInfo: string) {
		return this.service.verifyAndDecrypt(encryptInfo, hashInfo);
	}
}
