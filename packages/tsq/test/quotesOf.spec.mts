import { describe, test, assertType, expect } from 'vitest';
import type { Quoted, Identifier } from '../src/quotesOf.mjs';
import quotesOf from '../src/quotesOf.mjs';

type Assert<T extends true> = T;
type Equals<T, U> =
  (<G>() => G extends T ? 1 : 2) extends
  (<G>() => G extends U ? 1 : 2) ? true : false;

describe('quotesOf', () => {

  test('Identifier type enforces valid identifier', () => {
    assertType<Identifier>('asdf')
    assertType<Identifier>('_asdf')
    assertType<Identifier>('$_asdf')
    assertType<Identifier>('$asdf')
    assertType<Identifier>('$2asdf')

    // @ts-expect-error invalid identifier
    assertType<Identifier>('2asdf')
    // @ts-expect-error invalid identifier
    assertType<Identifier>('^asdf')
    // @ts-expect-error invalid identifier
    assertType<Identifier>('&asdf')
  });

  test('Quoted type transforms class methods', () => {
    class Hi {
      add(a: number, b: number) {
        return a + b;
      }
    }
    type HiQ = Quoted<Hi>
    type Add = HiQ['add']['func']
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type TypeAssertions = [
      Assert<Equals<
        Parameters<Add>[0],
        Identifier
      >>,
      Assert<Equals<
        Parameters<Add>[1],
        Identifier
      >>,
      Assert<Equals<
        ReturnType<Add>,
        string
      >>
    ];
  });

  test('quotesOf retrieves data from repo', () => {
    const X = {};
    Object.defineProperty(X, Symbol.for('ts-quotable.QuoteRepository'), {
      value: {
        add: {
          func: (a: string, b: string) => `function add(${a}: number, ${b}: number) {\n  return ${a} + ${b};\n}`
        }
      }
    });
    const q = quotesOf(X as any) as { add: { func: (a: string, b: string) => string } };
    expect(q.add.func('x', 'y')).to.equal('function add(x: number, y: number) {\n  return x + y;\n}');  
  });
});