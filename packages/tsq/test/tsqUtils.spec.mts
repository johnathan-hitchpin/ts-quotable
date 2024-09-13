import { quotesOfExec, transformSource } from './tsqUtils.mjs';
import { describe, test, expect } from 'vitest';

const QuotedSample =
`
import { quoted, quotesOf } from 'ts-quotable';

@quoted
class Hello {
  add(a: number, b: number) {
    return a + b;
  }
}

export default Hello;
`;

describe('tsqUtils', () => {

  test('transformSource uses plugin to transpile', async () => {
    
    const transformed = await transformSource(QuotedSample);
    expect(transformed).to
      .be.a('string')
      .and.satisfy(msg =>
        msg.startsWith(`import { quoted } from 'ts-quotable';`));
  });

  test('quotesOfExec uses default export of module', async () => {
    const r = await quotesOfExec(QuotedSample);
    expect(r.add.func('x', 'y')).to.equal(
`add(x: number, y: number) {
    return x + y;
  }`
    );
  });
});