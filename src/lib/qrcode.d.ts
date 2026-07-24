declare module 'qrcode' {
	export type QRCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

	export interface QRCodeRenderOptions {
		errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
		margin?: number;
		scale?: number;
		width?: number;
		color?: { dark?: string; light?: string };
	}

	export function toCanvas(
		canvas: HTMLCanvasElement,
		text: string,
		options?: QRCodeRenderOptions
	): Promise<HTMLCanvasElement>;

	export function toDataURL(text: string, options?: QRCodeRenderOptions): Promise<string>;
}
