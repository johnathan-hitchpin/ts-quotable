import * as ts from 'typescript';
import { createQuotation, createQuoteRepoExpression, type Quotations } from './generator.mjs';
import { createSegmentsFromDeclaration } from './templates.mjs';

function extractQuotations(
  cd: ts.ClassDeclaration
): Map<string, Quotations> {
  const quotations: Map<string, Quotations> = new Map<string, Quotations>();
  const visitClassMemberNode = (node: ts.ClassElement): ts.VisitResult<ts.ClassElement> => {
    if (node.kind === ts.SyntaxKind.MethodDeclaration) {
      const md = node as ts.MethodDeclaration;
      const funcQuotation = createQuotation(cd, md, createSegmentsFromDeclaration(md, 'func'));
      const bodyQuotation = createQuotation(cd, md, createSegmentsFromDeclaration(md, 'body'));
      quotations.set(md.name.getText()!, {
        func: funcQuotation,
        body: bodyQuotation
      });
    }
    return node;
  }
  cd.members.forEach(c => visitClassMemberNode(c));
  return quotations;
}

function visitNode(node: ts.Statement): ts.VisitResult<ts.Statement> {
  if (node.kind === ts.SyntaxKind.ClassDeclaration) {
    const cd = node as ts.ClassDeclaration;
    const quotations = extractQuotations(cd);
    const newModifiers: ts.ModifierLike[] =
      cd.modifiers.filter(m => !(
        m.kind === ts.SyntaxKind.Decorator &&
        (m as ts.Decorator).expression.getText() === 'quoted')
      );
    const cdNode = ts.factory.updateClassDeclaration(
      cd,
      newModifiers,
      cd.name,
      cd.typeParameters,
      cd.heritageClauses,
      cd.members
    )
    return [
      cdNode,
      createQuoteRepoExpression(cd, quotations)
    ];
  }

  return node;
}

const transformerFactory: ts.CustomTransformerFactory = function transformer(context) {
  return {
    transformSourceFile: (sourceFile) => {
      return ts.factory.updateSourceFile(
        sourceFile,
        ts.visitNodes(sourceFile.statements, visitNode) as unknown as ts.Statement[],
      )
    }
  } as ts.CustomTransformer;
};

export default transformerFactory;
export { extractQuotations, visitNode }