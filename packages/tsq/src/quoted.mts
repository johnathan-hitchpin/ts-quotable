const quoted: ClassDecorator = function(_target: Function) {
}

Object.defineProperty(quoted, 'saveRepo', {
  value: (target: any, r: Record<string, any>) => {
    Object.defineProperty(
      target,
      Symbol.for('ts-quotable.QuoteRepository'), {
        value: r
      }
    );
  }
});

export default quoted;