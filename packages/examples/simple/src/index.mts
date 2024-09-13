import chalk from 'chalk';
import { quoted, quotesOf } from 'ts-quotable';

// Mark a class as quoted to be able to quote any class
// member methods
@quoted
export class Quotable {

  // We want to emit typescript source code for this method,
  // but don't want to embed it as a string because then we
  // lose type safety and compile-time syntax checking.
  add(a: number, b: number) {
    return a + b;
  }
}

// Get the quotes for the class via quotesOf
const quotations = quotesOf(Quotable);

// Quote the function, but replace the parameter names with our own
const addQuoted = quotations.add.func('x', 'y');
console.log(chalk.green('Function Quotation:'));
console.log(addQuoted);
console.log();

// Quote the function body only
const bodyQuoted = quotations.add.body('x', 'y');
console.log(chalk.green('Body Quotation:'));
console.log(bodyQuoted);
console.log();