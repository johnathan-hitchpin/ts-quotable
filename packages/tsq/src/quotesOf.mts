type LowercaseAlphabet = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' |
  'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
type OtherIdChars = '$' | '_'
type IdentifierChars = LowercaseAlphabet | Uppercase<LowercaseAlphabet> | OtherIdChars
export type Identifier = `${IdentifierChars}${string}`

type MapToStringTuple<T> = {
  [K in keyof T]: Identifier
};
export type QuotedFunc<T extends (...args: any[]) => any> = (...args: MapToStringTuple<Parameters<T>>) => string;
export type QuotedUtils<T extends (...args: any[]) => any> = {
  func: QuotedFunc<T>,
  body: QuotedFunc<T>
}
export type Quoted<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? QuotedUtils<T[K]>
    : T[K]
}

function quotesOf<T>(cls: new (...args) => T): Quoted<T> {
  const repo = Reflect.get(cls, Symbol.for('ts-quotable.QuoteRepository')) as Record<string, any>;
  return repo as unknown as Quoted<T>;
}

export default quotesOf;