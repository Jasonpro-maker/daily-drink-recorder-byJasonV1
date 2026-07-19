declare module "node:test" {
  type TestBody = () => void | Promise<void>;
  const test: (name: string, body: TestBody) => void;
  export default test;
}

declare module "node:assert/strict" {
  const assert: {
    equal(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
    match(value: string, regexp: RegExp, message?: string): void;
    doesNotMatch(value: string, regexp: RegExp, message?: string): void;
  };
  export default assert;
}
