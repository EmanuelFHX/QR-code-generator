declare module "qrcode" {
  type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

  interface CreateOptions {
    errorCorrectionLevel?: ErrorCorrectionLevel;
    margin?: number;
  }

  interface QRCodeModel {
    modules: {
      size: number;
      get(row: number, col: number): boolean;
    };
  }

  const QRCode: {
    create(text: string, options?: CreateOptions): QRCodeModel;
  };

  export default QRCode;
}
