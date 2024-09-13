import * as ts from 'typescript';
import { createTemplate, type Segment } from './templates.mjs';

export interface Quotations {
  func: ts.Expression;
  body: ts.Expression
}

export const createQuoteRepoExpression = (
  cd: ts.ClassDeclaration,
  quotations: Map<string, Quotations>): ts.Expression => {
  
  const names = Array.from(quotations.keys());
  const objLit = ts.factory.createObjectLiteralExpression(
    names.map(name => {
      return ts.factory.createPropertyAssignment(
        name,
        ts.factory.createObjectLiteralExpression(
          Object.keys(quotations.get(name)!).map(key => {
            const q = quotations.get(name)! as unknown as { [i: string]: ts.Expression};
            
            return ts.factory.createPropertyAssignment(
              key,
              q[key]
            )
          })
        )
      );
    })
  );

  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier('quoted'),
      ts.factory.createIdentifier('saveRepo'),
    ),
    undefined,
    [
      ts.factory.createIdentifier(cd.name!.getText()!),
      objLit
    ]
  );
}

export const createQuotation = (
  _cd: ts.ClassDeclaration,
  md: ts.MethodDeclaration,
  segments: Segment[]
): ts.Expression => {
    const txt = md.getText();
    const arrow = ts.factory.createArrowFunction(
      undefined,
      undefined,
      md.parameters,
      ts.factory.createTypeReferenceNode('string'),
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      ts.factory.createBlock([
        ts.factory.createReturnStatement(
          createTemplate(segments)
        )
      ])
    );
    return arrow;
}