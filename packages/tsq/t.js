import { quoted } from 'ts-quotable';
class Hello {
    add(a, b) {
        return a + b;
    }
}
quoted.saveRepo(Hello, { add: { func: (a, b) => { return `add(${a}: number, ${b}: number) {\
    return ${a} + ${b};\
  }`; }, body: (a, b) => { return `return ${a} + ${b};`; } } })
export default Hello;
