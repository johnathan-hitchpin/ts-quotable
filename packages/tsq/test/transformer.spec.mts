import { describe, test, expect } from 'vitest';
import * as ts from 'typescript';
import { extractQuotations } from '../src/transformer.mjs';

const QuotedSample =
  `
import { quoted, quotesOf } from 'ts-quotable';

@quoted
class Hello {
  add(a: number, b: number) {
    return a + b;
  }

  get hi() {
    return 'hi';
  }
}

export default Hello;
`;

describe('transformer', () => {

  test('Transformer ignores non-method class members', () => {
    const sf = ts.createSourceFile('test.ts', QuotedSample, ts.ScriptTarget.ESNext, true);
    const stmt = sf.statements.find(s => s.kind === ts.SyntaxKind.ClassDeclaration)! as ts.ClassDeclaration;
    const quotations = extractQuotations(stmt);
    expect(stmt.members.length).toBe(2);
    expect(quotations.size).toBe(1);
  });
});