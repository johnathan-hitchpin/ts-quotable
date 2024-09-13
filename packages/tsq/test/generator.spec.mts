import { describe, test, expect } from 'vitest';
import { quotesOfExec } from './tsqUtils.mjs';

const QuotedSample =
`import { quoted, quotesOf } from 'ts-quotable';

@quoted
class Hello {
  add(a: number, b: number) {
    return a + b;
  }
}

export default Hello;`;

describe('generator', () => {

  test('generates repo containing quotation functions', async () => {
    const transformed = await quotesOfExec(QuotedSample);
    expect('add' in transformed).to.equal(true);
    const addQuotations = transformed['add'];
    expect('func' in addQuotations).to.equal(true);
    expect('body' in addQuotations).to.equal(true);

    expect(addQuotations.func('$x', '$y')).to.equal(
      `add($x: number, $y: number) {
    return $x + $y;
  }`);
    expect(addQuotations.body('$x', '$y')).to.equal(
      `return $x + $y;`);
  });
});