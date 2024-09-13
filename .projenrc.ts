import { typescript } from 'projen';
import { RootProject }  from './src';

const versions = {
  cdk: '2.150.0',
  constructs: '10.3.0',
  projen: '0.85.0',
  jsii: '~5.5.0',
  vitest: '2.0.5',
};
const root = new RootProject({
  name: '@ts-quotable/project',
  versions: versions
});

const tsqProject = new typescript.TypeScriptProject({
  parent: root,
  outdir: 'projects/tsq',
  name: 'ts-quotable',
  defaultReleaseBranch: 'main',
  jest: false,
  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true
    }
  },
  devDeps: ['vitest']
});
tsqProject.testTask.reset();
tsqProject.testTask.exec('vitest run');
