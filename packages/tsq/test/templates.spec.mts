import { describe, test, expect } from 'vitest';
import { createSegments } from './tsqUtils.mjs';
import * as ts from 'typescript';
import { createTemplate, Segment } from '../src/templates.mts';

const expectSeg = (segments: Segment[], i: number, fn: (n: Segment) => void) => {
  const n = segments[i];
  fn(n);
  return {
    thenA: () => expectSeg(segments, i + 1, (n) => {
      expect((n as ts.Identifier).text).to.equal('a');
    }),
    thenB: () => expectSeg(segments, i + 1, (n) => {
      expect((n as ts.Identifier).text).to.equal('b');
    }),
    thenText: (txt: string) => expectSeg(segments, i + 1, (n) => {
      expect(n).to.equal(txt);
    }),
  }
}
const expectFirstSegment = (segments, txt: string) => expectSeg(segments, 0, (n) => {
  expect(n).to.equal(txt);
});

describe('templates', () => {

  test('creates body segments from method', () => {

    const segs = createSegments(
      `function add(a: number, b: number) { return a + b; }`, 'body');
    
    expectFirstSegment(segs, 'return ')
      .thenA()
      .thenText(' + ')
      .thenB()
      .thenText(';');
  });

  test('creates func segments from method', () => {

    const segs = createSegments(
      `function add(a: number, b: number) { return a + b; }`, 'func');
    
    expectFirstSegment(segs, 'function add(')
      .thenA()
      .thenText(': number, ')
      .thenB()
      .thenText(': number) { return ')
      .thenA()
      .thenText(' + ')
      .thenB()
      .thenText('; }');
  });

  test('createSegments throws on unknown segmend kind', () =>{
    expect(() => createSegments(`function add(a: number, b: number) { return a + b; }`, 'asdf' as any))
      .to.throw('Unknkown segment kind.');
  })

  test('Creates expression from segments beginning with source', () => {
    const segs: Segment[] = [
      'function add(a: number, b: number) { return ',
      ts.factory.createIdentifier('a'),
      ' + ',
      ts.factory.createIdentifier('b'),
      '; }'
    ];
    const tmp = createTemplate(segs);
    const stmt = ts.factory.createExpressionStatement(tmp);
    const sf = ts.factory.createSourceFile([stmt], ts.factory.createToken(ts.SyntaxKind.EndOfFileToken), ts.NodeFlags.None);
    const p = ts.createPrinter();
    const printed = p.printFile(sf);
    expect(printed).to.equal('`function add(a: number, b: number) { return ${a} + ${b}; }`;\n');
  });

  test('Creates expression from segments beginning with identifier', () => {
    const segs: Segment[] = [
      ts.factory.createIdentifier('a'),
      ' + ',
      ts.factory.createIdentifier('b'),
    ];
    const tmp = createTemplate(segs);
    const stmt = ts.factory.createExpressionStatement(tmp);
    const sf = ts.factory.createSourceFile([stmt], ts.factory.createToken(ts.SyntaxKind.EndOfFileToken), ts.NodeFlags.None);
    const p = ts.createPrinter();
    const printed = p.printFile(sf);
    expect(printed).to.equal('`${a} + ${b}`;\n');
  });

  test('Creates expression from segments ending with text', () => {
    const segs: Segment[] = [
      ts.factory.createIdentifier('a'),
      ' + ',
      ts.factory.createIdentifier('b'),
      ';',
    ];
    const tmp = createTemplate(segs);
    const stmt = ts.factory.createExpressionStatement(tmp);
    const sf = ts.factory.createSourceFile([stmt], ts.factory.createToken(ts.SyntaxKind.EndOfFileToken), ts.NodeFlags.None);
    const p = ts.createPrinter();
    const printed = p.printFile(sf);
    expect(printed).to.equal("`${a} + ${b};`;\n");
  });
});