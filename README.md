<a id="readme-top"></a>

<br />
<div align="center">
  <h3 align="center">ts-quotable</h3>

  <p align="center">
    Enable easy, type-safe, compile-time-checked TypeScript source generation.
    <br />
    <br />
</div>

| Statements                  | Branches                | Functions                 | Lines             |
| --------------------------- | ----------------------- | ------------------------- | ----------------- |
| ![Statements](https://img.shields.io/badge/statements-100%25-brightgreen.svg?style=flat) | ![Branches](https://img.shields.io/badge/branches-96.19%25-brightgreen.svg?style=flat) | ![Functions](https://img.shields.io/badge/functions-97.22%25-brightgreen.svg?style=flat) | ![Lines](https://img.shields.io/badge/lines-100%25-brightgreen.svg?style=flat) |


## Quick Start

To get started:
```bash
# npm
npm install --save-dev ts-quotable
# yarn
yarn add -D ts-quotable
# pnpm
pnpm add --save-dev ts-quotable
```

Update package.json build script:
```json
{
  "script": {
    "build": "tsq"
  }
}
```

Mark class as quotable and use in codegen:
```typescript
import { quoted, quotesOf } from 'ts-quotation';

@quoted
export class CodegenQuotes {
  add(x: number, y: number) {
    return x + y;
  }
}

const writeLine = (s: string) => {
  fs.appendFileSync('generated.ts', s + '\n');
}

writeLine('class X {');
writeLine(quotesOf(CodegenQuotes).add.func('$a', '$b'));
writeLine('}');
```

The quoted function will be written to the file and the parameter names replaced with the provided names:
```typescript
class X {
  add($a: number, $b: number) {
    return $a + $b;
  }
}
```

## Overview
Typical TypeScript codegeneration methods require either using the verbose Compiler APIs to generate code using an abstract-syntax-tree representation of your desired output:

```typescript
const stmt = ts.factory.createFunctionDeclaration(
  undefined,
  undefined,
  'add',
  undefined,
  [
    ts.factory.createParameterDeclaration(undefined, undefined, 'x', undefined, ts.factory.createTypeReferenceNode('number'), undefined),
    ts.factory.createParameterDeclaration(undefined, undefined, 'y', undefined, ts.factory.createTypeReferenceNode('number'), undefined),
  ],
  ts.factory.createTypeReferenceNode('number'),
  ts.factory.createBlock([
    ts.factory.createReturnStatement(
      ts.factory.createBinaryExpression(ts.factory.createIdentifier('x'), ts.factory.createToken(ts.SyntaxKind.PlusToken), ts.factory.createIdentifier('y'))
    )
  ])
);
const sf = ts.factory.createSourceFile(
  [stmt],
  ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
  ts.NodeFlags.None);
const p = ts.createPrinter();

// This will output:
//   function add(x: number, y: number): number { return x + y; }
console.log(p.printFile(sf));
```

The use of the AST libraries is type-checked, but it is very possible to generate invalid TypeScript code using the AST, so this is not entirely safe, and very obviously verbose. The most common alternative is to drop all the way down into strings:

```typescript
console.log('function add(x: number, y: number): number) {');
console.log('  return x + y;');
console.log('}');
```

However, this is not safe at all - nothing is typechecked or syntax checked, and it requires all sorts of gross escape characters as the source gets more complicated. The dream would be to have the code you want to codegen sitting alongside the code that does the generating, so it can get checked and compiled at the same time, but also be able to parameterize the actual source string. Some programming languages have the concept of quotations, such as [F#](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/code-quotations#quoted-expressions) and [Elixir](https://hexdocs.pm/elixir/quote-and-unquote.html). TypeScript/JavaScript do not, but TypeScript does the next best thing - it offers a compiler API that allows for transformer plugins to transform the AST before emitting transpiled JS. This is most commonly used for embedding type information into the source to allow for RTTI/runtime-type-information (see [typescript-rtti](https://www.npmjs.com/package/typescript-rtti), [DeepKit](https://deepkit.io/library/type), and [RTTIST](https://docs.rttist.org/#/)), but we can use it to embed a parameterized version of original source code text.

This allows a much easier way of writing code that you want to emit in a codegen step:

```typescript
import chalk from 'chalk';
import { quoted, quotesOf } from 'tsq';

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
```

This results in the following JavaScript code when using the ts-quotable TypeScript compiler (tsq, instead of tsc):

```javascript
quoted.saveRepo(Quotable, {
  add: {
    func: (a, b) => { return
`add(${a}: number, ${b}: number) {
    return ${a} + ${b};
}`;
    },
    body: (a, b) => { return
`return ${a} + ${b};`;
    }
  }
})
```

Whenever you want to codegen the `add` function above, you just need to use the `quotesOf` function, and give it the class containing the methods you want to emit:

```typescript
import { Quotable } from './Quotable';
import { quotesOf } from 'ts-quotable';

quotesOf(Quotable)
```

The resulting object will contain a property for each method declaration in the original class, and each method will have multiple types of quotations you can generate:
* func - quote the entire function declaration and body
* body - only quote the body

Regardless of the type of quotation, the parameters are the same: for each parameter in the original function, there is one parameter in the quoted function. However, the parameter type is changed to a string. That's because when you invoke the quotation function, the values you provide as arguments are not providing *values* for the original function parameters, but rather providing new names for the parameters.

In our example above, the add function was originally declared with parameters `x` and `y`, but you can codegen a quoted version of that function with parameter names `a` and `b` by simply typing:

```typescript
quotesOf(Quotable).add.func('a', 'b');
```

## Usage

The easiest way to use this package is to use it as your TypeScript compiler. This package wraps tsc and adds its own transformer plugin, but otherwise uses the existing tsconfig to configure the compiler in the same way you'd normally expect.