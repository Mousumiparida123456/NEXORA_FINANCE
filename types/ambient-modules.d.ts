declare module "pino" {
  const pino: any;
  export default pino;
}

declare module "@google/generative-ai" {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(config: { model: string }): {
      generateContent(prompt: string): Promise<{
        response: { text(): string };
      }>;
    };
  }
}

declare module "bcryptjs" {
  const bcrypt: {
    genSalt(rounds?: number): Promise<string>;
    hash(data: string, salt: string): Promise<string>;
    compare(data: string, encrypted: string): Promise<boolean>;
  };
  export default bcrypt;
}

declare module "jsonwebtoken" {
  export function sign(payload: object, secretOrPrivateKey: string, options?: object): string;
  export function verify(token: string, secretOrPublicKey: string, options?: object): unknown;
}
