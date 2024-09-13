import { quoted } from 'ts-quotable';

@quoted
class Hello {
  add(a, b) { return a + b; }
}

quoted.saveRepo(Hello, {
  add: { 
    func: (a, b) => {
      return `add(${a}: number, ${b}: number) {\\n    return ${a} + ${b};\\n  }`;
    },
    body: (a, b) => {
      return `return ${a} + ${b};`;
    }
  }
});
export default Hello;