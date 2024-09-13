import * as ts from 'typescript';

export type Segment = string | ts.Identifier;
export type SegmentKind = 'func' | 'body';

export const createSegmentsFromDeclaration = (md: ts.MethodDeclaration | ts.FunctionDeclaration, k: SegmentKind): Segment[] => {
  
  let segments: Segment[] = [];
  let mdStart: number;
  let mdText: string;
  if (k === 'func') {
    mdStart = md.getStart();
    mdText = md.getText();
  } else if (k === 'body') {
    mdStart = md.body!.statements[0].getStart();
    mdText = md.body!.getText();
    mdText = mdText.substring(
      md.body!.statements[0].getStart() - md.body!.getStart(),
      md.body!.statements[md.body!.statements.length - 1].getEnd() - md.body!.getStart()
    )
  } else {
    throw new Error('Unknkown segment kind.');
  }
  
  let last = 0;
  const bodyVisitor = (n: ts.Node) => {
    if (n.kind === ts.SyntaxKind.Identifier && n.getText() !== md.name.getText()) {
      const idStart = n.getStart() - mdStart;
      if (idStart - last > 0) {
        segments.push(mdText.substring(last, idStart));
      }
      segments.push(n as ts.Identifier);
      last = n.getEnd() - mdStart;
    } else {
      n.getChildren().forEach(n => bodyVisitor(n));
    }
    return n;
  }

  if (k === 'func') {
    bodyVisitor(md);
  } else if (k === 'body') {
    bodyVisitor(md.body!);
  }

  if (last < mdText.length) {
    segments.push(mdText.slice(last));
  }

  return segments;
}

export const createTemplate = (segments: Segment[]): ts.TemplateExpression => {
  let head: ts.TemplateHead | undefined = undefined
  let spans: ts.TemplateSpan[] = [];
  const last = segments[segments.length - 1];
  let id: ts.Identifier | undefined = undefined;
  for (let segment of segments) {
    if (!head) {
      if (typeof segment === 'string') {
        head = ts.factory.createTemplateHead(segment);
      } else {
        head = ts.factory.createTemplateHead('');
        id = segment;
      }
      continue;
    }

    if (typeof segment === 'string') {
      let content: ts.TemplateMiddle | ts.TemplateTail;
      if (segment === last) {
        content = ts.factory.createTemplateTail(segment);
      } else {
        content = ts.factory.createTemplateMiddle(segment);
      }
      spans.push(ts.factory.createTemplateSpan(
        id,
        content
      ));
    } else {
      id = segment;
      if (segment === last) {
        spans.push(ts.factory.createTemplateSpan(
          segment,
          ts.factory.createTemplateTail('')
        ));
      }
    }
  }
  return ts.factory.createTemplateExpression(
    head!,
    spans!
  );
}